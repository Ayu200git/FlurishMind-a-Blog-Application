import React, { useState, useEffect } from 'react';
import Avatar from '../Image/Avatar';
import Loader from '../Loader/Loader';
import './UserProfile.css';

const UserProfile = ({ token, userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!token || !userId) return;

    const fetchUser = async () => {
      setLoading(true);
      const graphqlQuery = {
        query: `
          query {
            user {
              _id
              name
              email
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
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify(graphqlQuery),
        });

        const resData = await res.json();
        if (resData.errors) throw new Error(resData.errors[0].message);

        setUser(resData.data.user);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, userId]);

  if (loading) {
    return (
      <div className="user-profile__loader">
        <Loader />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="user-profile">
      <button 
        className="user-profile__toggle"
        onClick={() => setShowProfile(!showProfile)}
        aria-label="Toggle profile"
      >
        <div className="user-profile__avatar">
          {initials}
        </div>
      </button>
      {showProfile && (
        <div className="user-profile__dropdown">
          <div className="user-profile__header">
            <div className="user-profile__avatar-large">
              {initials}
            </div>
            <h3>{user.name}</h3>
            <p className="user-profile__email">{user.email}</p>
            {user.status && (
              <p className="user-profile__status">{user.status}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

