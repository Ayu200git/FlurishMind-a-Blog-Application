import React from 'react';
import ReactDOM from 'react-dom';
import './Backdrop.css';

const Backdrop = ({ open, onClick }) => {
  const backdropRoot = document.getElementById('backdrop-root');

  if (!backdropRoot) return null; // safe fallback

  return ReactDOM.createPortal(
    <div className={['backdrop', open ? 'open' : ''].join(' ')} onClick={onClick} />,
    backdropRoot
  );
};

export default Backdrop;
