import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Image from '../../../components/Image/Image';
import Loader from '../../../components/Loader/Loader';
import ErrorHandler from '../../../components/ErrorHandler/ErrorHandler';
import './SinglePost.css';

const SinglePost = ({ token }) => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingCommentIds, setDeletingCommentIds] = useState([]); // track deletions
  const authToken = token || localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      const graphqlQuery = {
        query: `
          query FetchPostWithComments($id: ID!) {
            post(id: $id) {
              _id
              title
              content
              imageUrl
              creator { _id name }
              createdAt
              likesCount
              commentsCount
              comments {
                _id
                content
                creator { _id name }
                createdAt
              }
            }
          }
        `,
        variables: { id: postId }
      };

      try {
        const res = await fetch('http://localhost:8080/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { Authorization: 'Bearer ' + authToken }),
          },
          body: JSON.stringify(graphqlQuery)
        });

        if (!res.ok) throw new Error('Failed to reach server');

        const resData = await res.json();
        if (resData.errors && resData.errors.length > 0) {
          throw new Error(resData.errors[0].message);
        }

        setPost(resData.data.post);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, authToken]);

  const errorHandler = () => setError(null);

  const imageUrl = post && post.imageUrl
    ? (post.imageUrl.startsWith('http') ? post.imageUrl : `http://localhost:8080/${post.imageUrl}`)
    : null;

  const handleAddComment = async () => {
    if (!authToken) {
      setError('Please login to add a comment.');
      return;
    }
    if (!commentText.trim()) return;

    setAdding(true);
    try {
      const graphqlQuery = {
        query: `
          mutation AddComment($content: String!, $postId: ID!) {
            addComment(commentInput: { content: $content, postId: $postId }) {
              _id
              content
              creator { _id name }
              createdAt
            }
          }
        `,
        variables: { content: commentText.trim(), postId }
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors && resData.errors.length > 0) {
        throw new Error(resData.errors[0].message);
      }

      const newComment = resData.data.addComment;

      // Append comment locally
      setPost((prev) => ({
        ...prev,
        comments: prev.comments ? [newComment, ...prev.comments] : [newComment],
        commentsCount: (prev.commentsCount || 0) + 1
      }));

      setCommentText('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!authToken) {
      setError('Please login to delete comments.');
      return;
    }

    // optimistic UI: mark deleting
    setDeletingCommentIds(prev => [...prev, commentId]);

    try {
      const graphqlQuery = {
        query: `
          mutation DeleteComment($commentId: ID!) {
            deleteComment(commentId: $commentId)
          }
        `,
        variables: { commentId }
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors && resData.errors.length > 0) {
        throw new Error(resData.errors[0].message);
      }

      // remove from UI
      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId),
        commentsCount: Math.max((prev.commentsCount || 1) - 1, 0)
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete comment');
    } finally {
      setDeletingCommentIds(prev => prev.filter(id => id !== commentId));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Loader />
      </div>
    );
  }

  if (!post) {
    return (
      <section className="single-post" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No post found.</p>
      </section>
    );
  }

  return (
    <section className="single-post">
      <ErrorHandler error={error} onHandle={errorHandler} />
      <h1>{post.title}</h1>
      <h2>
        Created by {post.creator?.name || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString('en-US')}
      </h2>

      {imageUrl && imageUrl !== 'https://via.placeholder.com/150' && (
        <div className="single-post__image" style={{ margin: '1rem 0' }}>
          <Image contain imageUrl={imageUrl} />
        </div>
      )}

      <p>{post.content}</p>

      <hr />

      <section className="single-post__comments">
        <h3>Comments ({post.commentsCount || 0})</h3>

        {/* Add comment box */}
        {authToken ? (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button
              onClick={handleAddComment}
              disabled={adding}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              {adding ? 'Posting...' : 'Post'}
            </button>
          </div>
        ) : (
          <p style={{ color: '#555' }}>Please login to add comments.</p>
        )}

        {/* Comments list */}
        {(!post.comments || post.comments.length === 0) && (
          <p style={{ color: '#666' }}>No comments yet. Be the first!</p>
        )}

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {post.comments && post.comments.map(comment => {
            const isCommentCreator = currentUserId && comment.creator?._id === currentUserId;
            return (
              <li key={comment._id} style={{ marginBottom: '0.75rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{comment.creator?.name || 'Unknown'}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#444' }}>{comment.content}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      {new Date(comment.createdAt).toLocaleString('en-US')}
                    </div>
                  </div>

                  <div>
                    {/* Show delete only for comment creator */}
                    {isCommentCreator && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        disabled={deletingCommentIds.includes(comment._id)}
                        style={{ background: 'transparent', border: 'none', color: '#c00', cursor: 'pointer' }}
                      >
                        {deletingCommentIds.includes(comment._id) ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
};

export default SinglePost;
