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
        email: String!
        password: String
        status: String!
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

    type RootQuery {
        login(email: String!, password: String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!): Post!
        user: User!
    }

    type RootMutation {
        createUser(userInput: UserInputData!): User!   # userInput marked non-nullable
        createPost(postInput: PostInputData!): Post!
        updatePost(id: ID!, postInput: PostInputData!): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
        likePost(postId: ID!): Post!
        unlikePost(postId: ID!): Post!
        addComment(commentInput: CommentInputData!): Comment!
        deleteComment(commentId: ID!): Boolean
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
