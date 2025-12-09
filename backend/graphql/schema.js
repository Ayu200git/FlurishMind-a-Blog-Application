const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
        likes: [User!]!
        likesCount: Int!
        comments: [Comment!]!
        commentsCount: Int!
    }

    type Comment {
        _id: ID!
        content: String!
        creator: User
        post: Post!
        createdAt: String!
    }

    type User {
        _id: ID!
        name: String!
        username: String!
        email: String!
        password: String
        bio: String!
        status: String!
        role: String!
        avatar: String
        posts: [Post!]!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    input CommentInputData {
        content: String!
        postId: ID!
    }

    input UpdateUserInput {
        name: String
        username: String
        bio: String
        status: String
        avatar: String
    }

    type RootQuery {
        login(email: String!, password: String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!): Post!
        user: User!
        users: [User!]!
        userById(userId: ID!): User!
    }

    type RootMutation {
        createUser(userInput: UserInputData!): User!   # userInput marked non-nullable
        createPost(postInput: PostInputData!): Post!
        updatePost(id: ID!, postInput: PostInputData!): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
        updateUser(userInput: UpdateUserInput!): User!
        likePost(postId: ID!): Post!
        unlikePost(postId: ID!): Post!
        addComment(commentInput: CommentInputData!): Comment!
        updateComment(commentId: ID!, content: String!): Comment!
        deleteComment(commentId: ID!): Boolean
        deleteUser(userId: ID!): Boolean
        makeAdmin(userId: ID!): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
