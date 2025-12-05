import React, { useState } from 'react';
import Button from '../../Button/Button';
import Image from '../../Image/Image';
import './Post.css';

const Post = ({
  author,
  authorImage, // <-- corrected spelling
  date,
  title,
  id,
  image,
  content,
  onStartEdit,
  onDelete,
  currentUserId,
  creatorId,
  likes = [],
  likesCount = 0,
  comments = 0,
  onLike,
  onComment
}) => {
  const isCreator = currentUserId && creatorId && currentUserId === creatorId;
  const isLiked =
    currentUserId &&
    likes &&
    likes.some(like => like._id?.toString() === currentUserId?.toString());

  // Construct full image URL if it's a relative path
  const imageUrl = image
    ? image.startsWith('http') ? image : `http://localhost:8080/${image}`
    : null;

  return (
    <article className="post">
      <header className="post__header">
        <div className="post__user">
          {authorImage ? (
            <img
              src={authorImage.startsWith('http') ? authorImage : `http://localhost:8080/${authorImage}`}
              alt={author}
              className="post__user-image"
            />
          ) : (
            <div className="post__user-placeholder">{author[0]}</div>
          )}
          <div className="post__user-info">
            <span className="post__author">{author}</span>
            <span className="post__date">{date}</span>
          </div>
        </div>
        <h1 className="post__title">{title}</h1>
      </header>

      {imageUrl && imageUrl !== 'https://via.placeholder.com/150' && (
        <div className="post__image">
          <Image imageUrl={imageUrl} contain />
        </div>
      )}

      {content && <div className="post__content">{content}</div>}

      <div className="post__actions">
        <Button mode="flat" link={`/post/${id}`}>
          View Post
        </Button>

        {isCreator ? (
          <>
            {onStartEdit && (
              <Button mode="flat" onClick={onStartEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button mode="flat" design="danger" onClick={onDelete}>
                Delete
              </Button>
            )}
          </>
        ) : (
          <>
            {onLike && (
              <Button mode="flat" onClick={onLike} design={isLiked ? 'accent' : null}>
                {isLiked ? '❤️ Liked' : '🤍 Like'} ({likesCount || 0})
              </Button>
            )}

            {onComment ? (
              <Button mode="flat" onClick={() => onComment(id)}>
                💬 Comment ({comments})
              </Button>
            ) : (
              <Button mode="flat" link={`/post/${id}`}>
                💬 Comment ({comments})
              </Button>
            )}
          </>
        )}
      </div>
    </article>
  );
};

export default Post;
