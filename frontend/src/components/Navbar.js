import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dashboard = user?.role === 'merchant' ? '/merchant/dashboard' : '/customer/dashboard';
  const close = () => setMenuOpen(false);
  return <nav className="navbar">
    <Link to="/" className="brand-lockup" onClick={close}><span className="brand-mark">F</span>FlexTenure</Link>
    <button className="nav-mobile-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '×' : '☰'}</button>
    <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
      <Link onClick={close} to="/#consumer">For consumers</Link><Link onClick={close} to="/how-it-works">How it works</Link><Link onClick={close} to="/#features">Features</Link><Link onClick={close} to="/#merchants">For merchants</Link><Link onClick={close} to="/faq">FAQs</Link>
      {user && <Link onClick={close} to={dashboard}>Dashboard</Link>}
      {user?.role === 'customer' && <Link onClick={close} to="/customer/finance">Finance hub</Link>}
    </div>
    <div className="nav-cta">{user ? <><span className="nav-hello">Hi, {user.name?.split(' ')[0]}</span><button className="btn" onClick={() => { logout(); navigate('/'); close(); }}>Sign out</button></> : <><Link to="/login" className="btn btn-ghost">Sign in</Link><Link to="/register" className="btn btn-primary">Get started ↗</Link></>}</div>
  </nav>;
}
