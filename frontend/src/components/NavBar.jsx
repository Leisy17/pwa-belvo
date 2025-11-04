import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext.jsx';
import './NavBar.css';

export const NavBar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const authLinks = isAuthenticated ? (
    <div className="nav-actions">
      <span className="nav-username">{user?.email}</span>
      <button className="nav-link nav-button" type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  ) : (
    <div className="nav-actions">
      {location.pathname !== '/login' ? (
        <Link className="nav-link" to="/login">
          Iniciar sesión
        </Link>
      ) : null}
      {location.pathname !== '/register' ? (
        <Link className="nav-link nav-button" to="/register">
          Crear cuenta
        </Link>
      ) : null}
    </div>
  );

  return (
    <header className="navbar">
      <Link className="nav-logo" to={isAuthenticated ? '/banks' : '/'}>
        Belvo PWA
      </Link>
      {authLinks}
    </header>
  );
};
