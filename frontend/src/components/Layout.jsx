import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar.jsx';
import './Layout.css';

export const Layout = ({ children }) => {
  return (
    <div className="layout">
      <NavBar />
      <main className="layout-content">{children || <Outlet />}</main>
    </div>
  );
};
