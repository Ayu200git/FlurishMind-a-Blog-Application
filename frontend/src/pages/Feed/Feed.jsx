import React, { useState, useEffect, useCallback, Fragment } from 'react';
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import FlashMessage from '../../components/FlashMessage/FlashMessage';
import './Feed.css';

const Feed = ({ userId, token, viewOnly = false, onNewPostRef, onEditRef }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [editPost, setEditPost] = useState(null);
  const [status, setStatus] = useState('');
  const [postPage, setPostPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  const authToken = token || localStorage.getItem('token');

  const catchError = (err) => setError(err.message || 'Something went wrong!');

  useEffect(() => {
    if (!authToken || viewOnly) return;

    const fetchStatus = async () => {
      const graphqlQuery = {
        query: `
          query {
            user {
              status
            }
          }
        `,
      };

      try {
        const res = await fetch('http://localhost:8080/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { Authorization: 'Bearer ' + authToken }),
          },
          body: JSON.stringify(graphqlQuery),
        });

        const resData = await res.json();
        if (resData.errors) throw new Error(resData.errors[0].message);

        setStatus(resData.data.user.status || '');
      } catch (err) {
        catchError(err);
      }
    };

    fetchStatus();
    loadPosts(); 
  }, [authToken, viewOnly]);

  const loadPosts = useCallback(
    async (direction) => {
      setPostsLoading(true);
      let page = postPage;
      if (direction === 'next') page++;
      if (direction === 'previous') page--;
      setPostPage(page);

      const graphqlQuery = {
        query: `
          query FetchPosts($page: Int!) {
            posts(page: $page) {
              posts {
                _id
                title
                content
                imageUrl
                creator { 
                  _id
                  name 
                }
                likes {
                  _id
                }
                likesCount
                commentsCount
                comments {
                  _id
                  content
                  creator {
                    _id
                    name
                  }
                  createdAt
                }
                createdAt
              }
              totalPosts
            }
          }
        `,
        variables: { page },
      };

      try {
        const res = await fetch('http://localhost:8080/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { Authorization: 'Bearer ' + authToken }),
          },
          body: JSON.stringify(graphqlQuery),
        });

        const resData = await res.json();
        if (resData.errors) throw new Error(resData.errors[0].message);

        const postsData = resData.data.posts || { posts: [], totalPosts: 0 };
        setPosts(postsData.posts || []);
        setTotalPosts(postsData.totalPosts || 0);
        setPostsLoading(false);
      } catch (err) {
        catchError(err);
        setPostsLoading(false);
      }
    },
    [postPage, authToken]
  );

  const statusUpdateHandler = async (event) => {
    event.preventDefault();

    const graphqlQuery = {
      query: `
        mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) {
            status
          }
        }
      `,
      variables: { status },
    };

    try {
      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: 'Bearer ' + authToken }),
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      setStatus(resData.data.updateStatus.status || '');
    } catch (err) {
      catchError(err);
    }
  };

  const newPostHandler = () => {
    if (viewOnly) return;
    setIsEditing(true);
  };

  useEffect(() => {
    if (onNewPostRef && onNewPostRef.current !== undefined) {
      onNewPostRef.current = newPostHandler;
    }
    if (onEditRef && onEditRef.current !== undefined) {
      onEditRef.current = () => {
        if (posts.length > 0) {
          startEditPostHandler(posts[0]._id);
        }
      };
    }
  }, [onNewPostRef, onEditRef, posts]);

  const startEditPostHandler = (postId) => {
    const loadedPost = posts.find((p) => p._id === postId);
    setIsEditing(true);
    setEditPost({ ...loadedPost });
  };

  const cancelEditHandler = () => {
    setIsEditing(false);
    setEditPost(null);
  };

  const finishEditHandler = async (postData) => {
    setEditLoading(true);
    setError(null);

    try {
      let imageUrl = '';

      if (postData.image instanceof File) {
        const formData = new FormData();
        formData.append('image', postData.image);
        if (editPost && editPost.imageUrl) {
          formData.append('oldPath', editPost.imageUrl);
        }

        const uploadRes = await fetch('http://localhost:8080/post-image', {
          method: 'PUT',
          headers: {
            ...(authToken && { Authorization: 'Bearer ' + authToken }),
          },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload image');

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.filePath;
      } else if (postData.imageUrl) {
        imageUrl = postData.imageUrl;
      } else if (editPost && editPost.imageUrl) {
        imageUrl = editPost.imageUrl;
      } else {
        imageUrl = 'https://via.placeholder.com/150';
      }

      const isUpdate = !!editPost;
      const graphqlQuery = isUpdate
        ? {
            query: `
              mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
                updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
                  _id
                  title
                  content
                  imageUrl
                  creator { _id name }
                  likes { _id }
                  likesCount
                  comments { _id content creator { _id name } createdAt }
                  commentsCount
                  createdAt
                }
              }
            `,
            variables: {
              id: editPost._id,
              title: postData.title,
              content: postData.content,
              imageUrl,
            },
          }
        : {
            query: `
              mutation CreatePost($title: String!, $content: String!, $imageUrl: String!) {
                createPost(postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
                  _id
                  title
                  content
                  imageUrl
                  creator { _id name }
                  likes { _id }
                  likesCount
                  comments { _id content creator { _id name } createdAt }
                  commentsCount
                  createdAt
                }
              }
            `,
            variables: {
              title: postData.title,
              content: postData.content,
              imageUrl,
            },
          };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: 'Bearer ' + authToken }),
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const post = isUpdate ? resData.data.updatePost : resData.data.createPost;

      setPosts((prev) => {
        if (isUpdate) {
          const updated = [...prev];
          const index = updated.findIndex((p) => p._id === editPost._id);
          if (index !== -1) updated[index] = post;
          return updated;
        } else {
          return [post, ...prev];
        }
      });

      setIsEditing(false);
      setEditPost(null);
      setEditLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create/edit post');
      setEditLoading(false);
    }
  };

  const statusInputChangeHandler = (input, value) => setStatus(value);

  const deletePostHandler = async (postId) => {
    setPostsLoading(true);
    setError(null);

    const graphqlQuery = {
      query: `
        mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }
      `,
      variables: { id: postId },
    };

    try {
      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: 'Bearer ' + authToken }),
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) {
        const error = resData.errors[0];
        const errorMessage = error.message || '';
        if (error.extensions?.status === 403 || errorMessage.includes('Not authorized')) {
          throw new Error('You are not authorized to delete this note. Only the creator can delete their own notes.');
        }
        throw new Error(errorMessage || 'Failed to delete note');
      }

      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setPostsLoading(false);
      setFlashMessage({ message: 'Note deleted successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setPostsLoading(false);
      const errorMessage = err.message || 'Failed to delete note';
      setFlashMessage({ message: errorMessage, type: 'error' });
      setError(errorMessage);
    }
  };

  const errorHandler = () => setError(null);
  const flashHandler = () => setFlashMessage(null);

  const handleLike = async (postId) => {
    if (!authToken) {
      setFlashMessage({ message: 'Please login to like posts', type: 'error' });
      return;
    }

    try {
      const post = posts.find(p => p._id === postId);
      const isLiked = post?.likes?.some(like => like._id?.toString() === userId?.toString()) || false;

      const graphqlQuery = {
        query: `
          mutation ${isLiked ? 'UnlikePost' : 'LikePost'}($postId: ID!) {
            ${isLiked ? 'unlikePost' : 'likePost'}(postId: $postId) {
              _id
              likesCount
              likes { _id }
              comments { _id content creator { _id name } createdAt }
              commentsCount
            }
          }
        `,
        variables: { postId },
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const updatedPost = resData.data[isLiked ? 'unlikePost' : 'likePost'];

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, ...updatedPost }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      setFlashMessage({ message: err.message || 'Failed to like/unlike post', type: 'error' });
    }
  };

  // Handle add comment
  const handleAddComment = async (postId, content) => {
    if (!authToken) {
      setFlashMessage({ message: 'Please login to comment', type: 'error' });
      return;
    }

    try {
      const graphqlQuery = {
        query: `
          mutation AddComment($content: String!, $postId: ID!) {
            addComment(commentInput: { content: $content, postId: $postId }) {
              _id
              content
              creator {
                _id
                name
              }
              createdAt
            }
          }
        `,
        variables: { content, postId },
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      // Reload posts to get updated comments
      loadPosts();
      setFlashMessage({ message: 'Comment added successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setFlashMessage({ message: err.message || 'Failed to add comment', type: 'error' });
    }
  };

  // Handle edit comment
  const handleEditComment = async (commentId, content) => {
    if (!authToken) {
      setFlashMessage({ message: 'Please login to edit comments', type: 'error' });
      return;
    }

    try {
      const graphqlQuery = {
        query: `
          mutation UpdateComment($commentId: ID!, $content: String!) {
            updateComment(commentId: $commentId, content: $content) {
              _id
              content
              creator {
                _id
                name
              }
              createdAt
            }
          }
        `,
        variables: { commentId, content },
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      loadPosts();
      setFlashMessage({ message: 'Comment updated successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setFlashMessage({ message: err.message || 'Failed to update comment', type: 'error' });
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!authToken) {
      setFlashMessage({ message: 'Please login to delete comments', type: 'error' });
      return;
    }

    try {
      const graphqlQuery = {
        query: `
          mutation DeleteComment($commentId: ID!) {
            deleteComment(commentId: $commentId)
          }
        `,
        variables: { commentId },
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      loadPosts();
      setFlashMessage({ message: 'Comment deleted successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setFlashMessage({ message: err.message || 'Failed to delete comment', type: 'error' });
    }
  };

  return (
    <Fragment>
      <FlashMessage
        message={flashMessage?.message}
        type={flashMessage?.type}
        onClose={flashHandler}
      />
      <ErrorHandler error={error} onHandle={errorHandler} />
      <FeedEdit
        editing={isEditing}
        selectedPost={editPost}
        loading={editLoading}
        onCancelEdit={cancelEditHandler}
        onFinishEdit={finishEditHandler}
      />
      {!viewOnly && (
        <section className="feed__status">
          <form onSubmit={statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={statusInputChangeHandler}
              value={status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
      )}
      <section className="feed">
        {postsLoading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Loader />
          </div>
        )}
        {posts.length <= 0 && !postsLoading && (
          <p style={{ textAlign: 'center' }}>No posts found.</p>
        )}
        {!postsLoading && (
          <Paginator
            onPrevious={() => loadPosts('previous')}
            onNext={() => loadPosts('next')}
            lastPage={Math.ceil(totalPosts / 2)}
            currentPage={postPage}
          >
            {posts.map((post) => {
              const isCreator = userId && post.creator?._id && userId === post.creator._id;
              return (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator?.name || 'Unknown'}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={isCreator ? () => startEditPostHandler(post._id) : null}
                  onDelete={isCreator ? () => deletePostHandler(post._id) : null}
                  currentUserId={userId}
                  creatorId={post.creator?._id}
                  likes={post.likes || []}
                  likesCount={post.likesCount || 0}
                  comments={post.comments || []}
                  commentsCount={post.commentsCount || 0}
                  onLike={userId ? () => handleLike(post._id) : null}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  token={authToken}
                />
              );
            })}
          </Paginator>
        )}
      </section>
    </Fragment>
  );
};

export default Feed;
