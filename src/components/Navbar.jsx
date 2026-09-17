import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountDropdown from './AccountDropdown';

export default function Navbar({ onOpenCompat, onOpenTracker }) {
  const { totalItemsCount, openCart, currentView, setCurrentView } = useCart();
  const { isCustomer, isAdmin, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (viewName, hashTarget = null) => {
    setCurrentView(viewName);
    setMobileOpen(false);
    if (window.location.pathname !== '/') navigate('/');
    if (hashTarget) {
      setTimeout(() => {
        const el = document.querySelector(hashTarget);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTrackOrder = () => {
    navigate(isCustomer && !isAdmin ? '/account/orders' : '/track-order');
    setMobileOpen(false);
  };

  return (
    <>
      <header className={`pro-navbar-sticky ${scrolled ? 'has-scrolled' : 'is-transparent'}`}>
        <div className="pro-nav-container">
          <nav className="pro-nav">
            {/* Left: Clean Brand Mark */}
            <button 
              className="pro-brand-btn"
              onClick={() => handleNav('home')}
            >
              <img src="/assets/brand/LOGO.png" alt="ShopXzetio Logo" className="pro-brand-logo" />
              <span className="pro-brand-title">
                SHOP<span>XZETIO</span>
              </span>
            </button>

            {/* Center: Clean Minimalist Navigation Links */}
            <div className="pro-nav-links">
              <button 
                className={`pro-nav-link ${(!currentView || currentView === 'home' || currentView === 'store') ? 'active' : ''}`}
                onClick={() => handleNav('home')}
              >
                Home
              </button>
              <button 
                className={`pro-nav-link ${currentView === 'coolers' ? 'active' : ''}`}
                onClick={() => handleNav('coolers')}
              >
                Coolers
              </button>
              <button 
                className={`pro-nav-link ${currentView === 'audio' ? 'active' : ''}`}
                onClick={() => handleNav('audio')}
              >
                Audio
              </button>
              <button 
                className={`pro-nav-link ${currentView === 'splitters' ? 'active' : ''}`}
                onClick={() => handleNav('splitters')}
              >
                Splitters
              </button>
              <button 
                className={`pro-nav-link ${currentView === 'arsenal' ? 'active' : ''}`}
                onClick={() => handleNav('arsenal')}
              >
                Arsenal
              </button>
              <button 
                className="pro-nav-link"
                onClick={() => handleNav('home', '#inside-shopxzetio')}
              >
                Reels
              </button>
              <button 
                className="pro-nav-link pro-nav-highlight"
                onClick={onOpenCompat}
              >
                <i className="fa-solid fa-mobile-screen-button"></i> Matcher
              </button>
            </div>

            {/* Right: Clean Pro Actions */}
            <div className="pro-nav-actions">
              {/* WhatsApp Support Icon Button */}
              <a 
                href="https://wa.me/923348590229?text=Hello%20ShopXzetio!%20I%20have%20an%20inquiry%20regarding%20gaming%20gear." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="pro-btn-support pro-btn-whatsapp-icon"
                title="WhatsApp Support"
                aria-label="WhatsApp Support"
              >
                <i className="fa-brands fa-whatsapp"></i>
              </a>

              <div className="nav-account-actions">
                {isAdmin
                  ? <button className="nav-account-link" onClick={() => navigate('/admin')}><i className="fa-solid fa-shield-halved"/><span>Admin</span></button>
                  : isCustomer
                    ? <AccountDropdown profile={profile} onLogout={logout}/>
                    : <button className="nav-account-link nav-signup" onClick={() => navigate('/login')} aria-label="Login or create an account" title="Login / Sign Up"><i className="fa-solid fa-user"/><span>Login / Sign Up</span></button>}
              </div>

              {/* Minimalist Cart Button */}
              <button 
                className="pro-btn-cart" 
                onClick={openCart}
                aria-label="Open Armory Cart"
                title="Armory Cart"
              >
                <i className="fa-solid fa-cart-shopping"></i>
                {totalItemsCount > 0 && (
                  <span className="pro-cart-badge">{totalItemsCount}</span>
                )}
              </button>

              {/* Mobile Menu Toggle Button */}
              <button 
                className="pro-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Navigation Menu"
              >
                <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="pro-mobile-backdrop" onClick={() => setMobileOpen(false)}>
          <div className="pro-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="pro-mobile-header">
              <div className="pro-brand">
                <img src="/assets/brand/LOGO.png" alt="ShopXzetio Logo" className="pro-brand-logo" />
                <span className="pro-brand-title">SHOP<span>XZETIO</span></span>
              </div>
              <button className="pro-mobile-close" onClick={() => setMobileOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Mobile Quick Action Banner (Matcher) */}
            <div className="pro-mobile-actions-single">
              <button 
                className="pro-mobile-action-card card-matcher full-width"
                onClick={() => { setMobileOpen(false); onOpenCompat(); }}
              >
                <div className="action-card-icon">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </div>
                <div className="action-card-text">
                  <strong>Device Matcher</strong>
                  <span>Find compatible coolers & gear for your phone</span>
                </div>
              </button>
            </div>

            <div className="pro-mobile-nav">
              <button className="pro-mobile-link-btn mobile-track-order" onClick={handleTrackOrder}><i className="fa-solid fa-box-location-dot"/> Track Order</button>
              {isCustomer ? <>
                <button className="pro-mobile-link-btn" onClick={() => { navigate(isAdmin ? '/admin' : '/account'); setMobileOpen(false); }}><i className={`fa-solid ${isAdmin ? 'fa-shield-halved' : 'fa-user'}`}/> {isAdmin ? 'Admin Portal' : 'My Account'}</button>
                <button className="pro-mobile-link-btn" onClick={() => { logout(); setMobileOpen(false); }}><i className="fa-solid fa-right-from-bracket"/> Logout</button>
              </> : <button className="pro-mobile-link-btn" onClick={() => { navigate('/login'); setMobileOpen(false); }}><i className="fa-solid fa-user"/> Login / Sign Up</button>}
              <button 
                className={`pro-mobile-link-btn ${(!currentView || currentView === 'home') ? 'active' : ''}`}
                onClick={() => handleNav('home')}
              >
                <i className="fa-solid fa-house"></i> Home Base
              </button>
              <button 
                className={`pro-mobile-link-btn ${currentView === 'coolers' ? 'active' : ''}`}
                onClick={() => handleNav('coolers')}
              >
                <i className="fa-solid fa-snowflake"></i> Phone Coolers
              </button>
              <button 
                className={`pro-mobile-link-btn ${currentView === 'audio' ? 'active' : ''}`}
                onClick={() => handleNav('audio')}
              >
                <i className="fa-solid fa-headphones"></i> Gaming Audio
              </button>
              <button 
                className={`pro-mobile-link-btn ${currentView === 'splitters' ? 'active' : ''}`}
                onClick={() => handleNav('splitters')}
              >
                <i className="fa-solid fa-bolt"></i> 60W DAC Splitters
              </button>
              <button 
                className={`pro-mobile-link-btn ${currentView === 'accessories' ? 'active' : ''}`}
                onClick={() => handleNav('accessories')}
              >
                <i className="fa-solid fa-gamepad"></i> Sleeves & Accessories
              </button>
              <button 
                className={`pro-mobile-link-btn ${currentView === 'arsenal' ? 'active' : ''}`}
                onClick={() => handleNav('arsenal')}
              >
                <i className="fa-solid fa-boxes-stacked"></i> Full 22-Gear Arsenal
              </button>
              <button 
                className="pro-mobile-link-btn"
                onClick={() => handleNav('home', '#inside-shopxzetio')}
              >
                <i className="fa-solid fa-circle-play"></i> Inside Xzetio Reels
              </button>
            </div>

            <div className="pro-mobile-footer">
              <a 
                href="https://wa.me/923348590229" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="pro-mobile-whatsapp-btn"
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>Direct WhatsApp: 0334-8590229</span>
              </a>
              <div className="pro-mobile-policy-strip">
                <span>🛡️ 7 Days Warranty</span>
                <span>💵 COD Nationwide</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
