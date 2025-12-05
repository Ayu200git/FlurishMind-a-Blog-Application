import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';
import UserProfile from '../../UserProfile/UserProfile';
import './MobileNavigation.css';

// NavigationItems component inside this file
const NavigationItems = ({ isAuth, onChoose, onLogout, onNewPost, onEdit }) => {
  const navItems = [
    { id: 'feed', text: 'Feed', link: '/', auth: true },
    { id: 'login', text: 'Login', link: '/login', auth: false },
    { id: 'signup', text: 'Signup', link: '/signup', auth: false }
  ];

  const filteredItems = navItems
    .filter(item => item.auth === isAuth)
    .map(item => (
      <li key={item.id} className="navigation-item mobile">
        <NavLink to={item.link} onClick={onChoose}>
          {item.text}
        </NavLink>
      </li>
    ));

  return (
    <>
      {filteredItems}
      {isAuth && (
        <>
          <li className="navigation-item mobile">
            <button onClick={onNewPost}>New Post</button>
          </li>
          <li className="navigation-item mobile">
            <button onClick={onEdit}>Edit</button>
          </li>
          <li className="navigation-item mobile">
            <button onClick={onLogout}>Logout</button>
          </li>
        </>
      )}
    </>
  );
};

// Hamburger toggle component inside this file
const MobileToggle = ({ onOpen }) => (
  <button className="mobile-toggle" onClick={onOpen}>
    <span className="mobile-toggle__bar" />
    <span className="mobile-toggle__bar" />
    <span className="mobile-toggle__bar" />
  </button>
);

// Full MobileNavigation component
const MobileNavigation = ({ isAuth, onLogout, onNewPost, onEdit, token, userId }) => {
  const [open, setOpen] = useState(false);

  const toggleSidebar = () => setOpen(prev => !prev);
  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* Top navbar with user profile and theme toggle */}
      <nav className="main-nav">
        <MobileToggle onOpen={toggleSidebar} />
        <div className="spacer" />
        <ul className="main-nav__items main-nav__items--desktop">
          <li>
            <ThemeToggle />
          </li>
          {isAuth && userId && token && (
            <li>
              <UserProfile token={token} userId={userId} />
            </li>
          )}
        </ul>
      </nav>

      {/* Sidebar */}
      <nav className={`mobile-nav ${open ? 'open' : ''}`}>
        <ul className="mobile-nav__items">
          <NavigationItems
            isAuth={isAuth}
            onChoose={closeSidebar}
            onLogout={onLogout}
            onNewPost={onNewPost}
            onEdit={onEdit}
          />
        </ul>
        {/* Overlay to close sidebar */}
        {open && <div className="mobile-nav__backdrop" onClick={closeSidebar}></div>}
      </nav>
    </>
  );
};

export default MobileNavigation;
