import React, { useState } from 'react';
import Button from '../Button/Button';
import Input from '../Form/Input/Input';
import './Comments.css';

const Comments = ({ 
  comments = [], 
  postId, 
  currentUserId, 
  token, 
  onAddComment, 
  onEditComment, 
  onDeleteComment 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await onAddComment(postId, newComment.trim());
    setNewComment('');
  };

  const handleEditComment = async (commentId, currentContent) => {
    if (editingCommentId === commentId) {
      // Save edit
      if (editContent.trim() && editContent !== currentContent) {
        await onEditComment(commentId, editContent.trim());
      }
      setEditingCommentId(null);
      setEditContent('');
    } else {
      // Start editing
      setEditingCommentId(commentId);
      setEditContent(currentContent);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDeleteComment(commentId);
    }
  };

  return (
    <div className="comments">
      <div className="comments__header">
        <button 
          className="comments__toggle"
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? 'Hide' : 'Show'} Comments ({comments.length})
        </button>
      </div>

      {showComments && (
        <div className="comments__content">
          {token && (
            <form className="comments__form" onSubmit={handleAddComment}>
              <Input
                id="new-comment"
                placeholder="Write a comment..."
                control="input"
                value={newComment}
                onChange={(id, value) => setNewComment(value)}
              />
              <Button mode="flat" type="submit" disabled={!newComment.trim()}>
                Post
              </Button>
            </form>
          )}

          <div className="comments__list">
            {comments.length === 0 ? (
              <p className="comments__empty">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor = currentUserId && comment.creator?._id === currentUserId;
                const isEditing = editingCommentId === comment._id;

                const commentAuthorName = comment.creator?.name || 'Unknown';
                const commentAuthorInitials = commentAuthorName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const commentAuthorAvatar = comment.creator?.avatar;

                return (
                  <div key={comment._id} className="comment">
                    <div className="comment__wrapper">
                      <div className="comment__avatar">
                        {commentAuthorAvatar ? (
                          <img 
                            src={commentAuthorAvatar.startsWith('http') ? commentAuthorAvatar : `http://localhost:8080/${commentAuthorAvatar}`} 
                            alt={commentAuthorName}
                          />
                        ) : (
                          <div className="comment__avatar-placeholder">
                            {commentAuthorInitials}
                          </div>
                        )}
                      </div>
                      
                      <div className="comment__content-wrapper">
                        {isEditing ? (
                          <div className="comment__edit">
                            <Input
                              id={`edit-comment-${comment._id}`}
                              control="input"
                              value={editContent}
                              onChange={(id, value) => setEditContent(value)}
                            />
                            <div className="comment__edit-actions">
                              <Button 
                                mode="flat" 
                                onClick={() => handleEditComment(comment._id, comment.content)}
                                disabled={!editContent.trim()}
                              >
                                Save
                              </Button>
                              <Button mode="flat" design="danger" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="comment__text">
                              <span className="comment__author">{commentAuthorName}</span>
                              <span className="comment__text-content">{comment.content}</span>
                            </div>
                            <div className="comment__meta">
                              <span className="comment__date">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </span>
                              {(isCommentAuthor || currentUserId) && (
                                <div className="comment__actions">
                                  {isCommentAuthor && (
                                    <>
                                      <button 
                                        className="comment__action-btn"
                                        onClick={() => handleEditComment(comment._id, comment.content)}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        className="comment__action-btn comment__action-btn--delete"
                                        onClick={() => handleDeleteComment(comment._id)}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;

