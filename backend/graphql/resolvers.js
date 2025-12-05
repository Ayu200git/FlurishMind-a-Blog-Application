const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { clearImage } = require('../util/file');

module.exports = {
  // ===================== USER =====================
  createUser: async function ({ userInput }) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) errors.push({ message: 'E-Mail is invalid.' });
    if (!userInput.password || !validator.isLength(userInput.password, { min: 5 })) errors.push({ message: 'Password too short!' });
    if (!userInput.name || validator.isEmpty(userInput.name.trim())) errors.push({ message: 'Name is required.' });
    if (errors.length > 0) {
      const err = new Error('Invalid input.');
      err.data = errors;
      err.code = 422;
      throw err;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const err = new Error('User exists already!');
      err.code = 422;
      throw err;
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
      status: 'I am new!'
    });

    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function ({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('User not found.');
      err.code = 401;
      throw err;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const err = new Error('Password is incorrect.');
      err.code = 401;
      throw err;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      'somesupersecretsecret',
      { expiresIn: '1h' }
    );

    return { token, userId: user._id.toString() };
  },

  user: async function (_, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    const user = await User.findById(context.userId);
    if (!user) throw new Error('No user found!');
    return { ...user._doc, _id: user._id.toString() };
  },

  updateStatus: async function ({ status }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    const user = await User.findById(context.userId);
    if (!user) throw new Error('No user found!');
    user.status = status;
    await user.save();
    return { ...user._doc, _id: user._id.toString() };
  },

  // ===================== POSTS =====================
  createPost: async function ({ postInput }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');

    const errors = [];
    if (!postInput.title || !validator.isLength(postInput.title, { min: 5 })) errors.push({ message: 'Title is invalid.' });
    if (!postInput.content || !validator.isLength(postInput.content, { min: 5 })) errors.push({ message: 'Content is invalid.' });
    if (errors.length > 0) {
      const err = new Error('Invalid input.');
      err.data = errors;
      err.code = 422;
      throw err;
    }

    const user = await User.findById(context.userId);
    if (!user) throw new Error('Invalid user.');

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    });

    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
      likesCount: 0,
      commentsCount: 0,
      comments: []
    };
  },

  posts: async function ({ page }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    if (!page) page = 1;
    const perPage = 2;

    const totalPosts = await Post.countDocuments();

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator', 'name _id')
      .populate('likes', 'name _id');

    const postsWithComments = await Promise.all(
      posts.map(async (p) => {
        const comments = await Comment.find({ post: p._id })
          .populate('creator', 'name email')
          .sort({ createdAt: -1 });

        return { post: p, comments };
      })
    );

    return {
      posts: postsWithComments.map(({ post, comments }) => ({
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        likesCount: post.likes.length,
        commentsCount: comments.length,
        comments: comments.map(c => ({
          ...c._doc,
          _id: c._id.toString(),
          createdAt: c.createdAt.toISOString(),
          creator: c.creator
            ? { _id: c.creator._id.toString(), name: c.creator.name, email: c.creator.email }
            : { _id: '0', name: 'Unknown', email: '' }
        }))
      })),
      totalPosts
    };
  },

  post: async function ({ id }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    const post = await Post.findById(id)
      .populate('creator', 'name _id')
      .populate('likes', 'name _id');
    if (!post) throw new Error('No post found!');

    const comments = await Comment.find({ post: id })
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      likesCount: post.likes.length,
      commentsCount: comments.length,
      comments: comments.map(c => ({
        ...c._doc,
        _id: c._id.toString(),
        createdAt: c.createdAt.toISOString(),
        creator: c.creator
          ? { _id: c.creator._id.toString(), name: c.creator.name, email: c.creator.email }
          : { _id: '0', name: 'Unknown', email: '' }
      }))
    };
  },

  updatePost: async function ({ id, postInput }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    const post = await Post.findById(id).populate('creator');
    if (!post) throw new Error('No post found!');
    if (post.creator._id.toString() !== context.userId) throw new Error('Not authorized!');

    const errors = [];
    if (!postInput.title || !validator.isLength(postInput.title, { min: 5 })) errors.push({ message: 'Title is invalid.' });
    if (!postInput.content || !validator.isLength(postInput.content, { min: 5 })) errors.push({ message: 'Content is invalid.' });
    if (errors.length > 0) {
      const err = new Error('Invalid input.');
      err.data = errors;
      err.code = 422;
      throw err;
    }

    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== 'undefined') post.imageUrl = postInput.imageUrl;

    const updatedPost = await post.save();
    const comments = await Comment.find({ post: id }).populate('creator', 'name email');

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
      likesCount: post.likes.length,
      commentsCount: comments.length,
      comments: comments.map(c => ({
        ...c._doc,
        _id: c._id.toString(),
        createdAt: c.createdAt.toISOString(),
        creator: c.creator
          ? { _id: c.creator._id.toString(), name: c.creator.name, email: c.creator.email }
          : { _id: '0', name: 'Unknown', email: '' }
      }))
    };
  },

  deletePost: async function ({ id }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    const post = await Post.findById(id);
    if (!post) throw new Error('No post found!');
    if (post.creator.toString() !== context.userId) throw new Error('Not authorized!');

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);

    const user = await User.findById(context.userId);
    user.posts.pull(id);
    await user.save();

    return true;
  },

  // ===================== COMMENTS =====================
 addComment: async function ({ commentInput }, context) {
  if (!context?.isAuth) throw new Error('Not authenticated!');
  if (!commentInput.content?.trim()) throw new Error('Comment cannot be empty!');

  const post = await Post.findById(commentInput.postId);
  if (!post) throw new Error('Post not found!');

  const user = await User.findById(context.userId);
  if (!user) throw new Error('User not found!');

  const comment = new Comment({
    content: commentInput.content,
    post: post._id,
    creator: user._id
  });

  const createdComment = await comment.save();

  await createdComment.populate('creator', 'name email');

   return {
  _id: createdComment._id.toString(),
  content: createdComment.content,
  createdAt: createdComment.createdAt.toISOString(),
  creator: createdComment.creator
    ? {
        _id: createdComment.creator._id.toString(),
        name: createdComment.creator.name || 'Unknown', // fallback if name missing
        email: createdComment.creator.email || ''
      }
    : {
        _id: '0',
        name: 'Unknown',
        email: ''
      },
  post: {
    _id: post._id.toString(),
    title: post.title
  }
};

     
},




  deleteComment: async function ({ commentId }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');

    const comment = await Comment.findById(commentId).populate('creator', 'name _id');
    if (!comment) throw new Error('Comment not found!');
    if (comment.creator._id.toString() !== context.userId) throw new Error('Not authorized!');

    await Comment.findByIdAndDelete(commentId);
    return true;
  },

  // ===================== LIKE / UNLIKE =====================
  likePost: async function ({ postId }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found!');

    const userId = context.userId.toString();
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();
    }

    const comments = await Comment.find({ post: postId }).populate('creator', 'name email');
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      likesCount: post.likes.length,
      commentsCount: comments.length,
      comments: comments.map(c => ({
        ...c._doc,
        _id: c._id.toString(),
        createdAt: c.createdAt.toISOString(),
        creator: {
          _id: c.creator._id.toString(),
          name: c.creator.name,
          email: c.creator.email
        }
      }))
    };
  },

  unlikePost: async function ({ postId }, context) {
    if (!context?.isAuth) throw new Error('Not authenticated!');
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found!');

    const userId = context.userId.toString();
    post.likes = post.likes.filter(like => like.toString() !== userId);
    await post.save();

    const comments = await Comment.find({ post: postId }).populate('creator', 'name email');
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      likesCount: post.likes.length,
      commentsCount: comments.length,
      comments: comments.map(c => ({
        ...c._doc,
        _id: c._id.toString(),
        createdAt: c.createdAt.toISOString(),
        creator: {
          _id: c.creator._id.toString(),
          name: c.creator.name,
          email: c.creator.email
        }
      }))
    };
  }
};
