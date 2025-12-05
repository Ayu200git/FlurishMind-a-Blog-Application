import React from 'react';
import { NavLink } from 'react-router-dom';

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
        <Logo />
      </NavLink>
    </div>
    <div className="spacer" />
    <ul className="main-nav__items">
      <li>
        <ThemeToggle />
      </li>
      {isAuth && userId && token && (
        <li>
          <UserProfile token={token} userId={userId} />
        </li>
      )}
      <NavigationItems 
        isAuth={isAuth} 
        onLogout={onLogout}
        onNewPost={onNewPost}
        onEdit={onEdit}
      />
    </ul>
  </nav>
);

export default MainNavigation;
