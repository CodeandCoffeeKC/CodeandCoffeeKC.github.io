import React from 'react'
import { Link } from 'react-router-dom'
import './Layout.css'

function Layout({ children }) {
  return (
    <div className="layout">
      <header className="layout-header" role="banner">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <h1 className="logo-text">Code & Coffee KC</h1>
            </Link>
            <nav className="nav" role="navigation">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/about" className="nav-link">About</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="layout-main" role="main">
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="layout-footer" role="contentinfo">
        <div className="container">
          <p className="footer-text">
            &copy; {new Date().getFullYear()} Code and Coffee KC. Part of the national Code and Coffee community.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
