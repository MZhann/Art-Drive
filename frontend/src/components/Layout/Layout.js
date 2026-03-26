import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css';

const Layout = () => {
  console.log('Layout');
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3 className="text-gradient">ArtDrive</h3>
              <p className="text-muted">Kazakhstan's Premier Photography Competition Platform</p>
            </div>
            <div className="footer-links">
              <a href="/tournaments">Tournaments</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="text-muted">© 2024 ArtDrive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

