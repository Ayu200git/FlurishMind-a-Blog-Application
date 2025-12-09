import React from 'react';
import { Link, NavLink } from 'react-router-dom';

import MobileToggle from '../MobileToggle/MobileToggle';
import Logo from '../../Logo/Logo';
import NavigationItems from '../NavigationItems/NavigationItems';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';
import UserProfile from '../../UserProfile/UserProfile';

import './MainNavigation.css';

const MainNavigation = ({ onOpenMobileNav, isAuth, onLogout, onNewPost, onEdit, userId, token }) => (
  <nav className="main-nav">
    <MobileToggle onOpen={onOpenMobileNav} />
    <div className="main-nav__logo">
       <NavLink to="/">
        <img 
          src="flurishmindlogo.png" 
          alt="Logo" 
          className="main-nav__logo-img"
        />
      </NavLink>
    </div>
    <div className="spacer" />
    
    {/* Mobile/Tablet: Show only essential items */}
    <div className="main-nav__mobile-items">
      {isAuth && userId && token && (
        <UserProfile token={token} userId={userId} onLogout={onLogout} />
      )}
      <ThemeToggle />
    </div>

    {/* Desktop: Show full navigation */}
    <ul className="main-nav__items">
      <NavigationItems 
        isAuth={isAuth} 
        onLogout={onLogout}
        onNewPost={onNewPost}
        onEdit={onEdit}
      />

      {isAuth && userId && token && (
        <li>
          <UserProfile token={token} userId={userId} onLogout={onLogout} />
        </li>
      )}

      <li>
        <ThemeToggle />
      </li>
    </ul>
  </nav>
);

export default MainNavigation;
