import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const customerItems = [
  ['fa-box', 'My Orders', '/account/orders'],
  ['fa-location-crosshairs', 'Track Order', '/account/track'],
  ['fa-heart', 'Wishlist', '/account/wishlist'],
  ['fa-location-dot', 'Saved Addresses', '/account/addresses'],
  ['fa-bell', 'Notifications', '/account/notifications'],
  ['fa-user', 'Profile', '/account/profile'],
];

export default function AccountDropdown({ profile, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const displayName = profile?.full_name?.trim()?.split(/\s+/)[0] || 'Account';

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        rootRef.current?.querySelector('[aria-haspopup="menu"]')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const openRoute = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleMenuKeys = (event) => {
    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') || []);
    const current = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(current + 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(current - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault(); items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault(); items.at(-1)?.focus();
    }
  };

  return <div className="account-dropdown" ref={rootRef}>
    <button
      className="nav-account-link account-dropdown-trigger"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus());
        }
      }}
    >
      <i className="fa-solid fa-user"/><span>{displayName}</span><i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} account-dropdown-chevron`}/>
    </button>
    {open && <div className="account-dropdown-menu" role="menu" ref={menuRef} onKeyDown={handleMenuKeys}>
      <div className="account-dropdown-label">MY ACCOUNT</div>
      {customerItems.map(([icon, label, path]) => <button key={path} role="menuitem" onClick={() => openRoute(path)}><i className={`fa-solid ${icon}`}/><span>{label}</span></button>)}
      <div className="account-dropdown-separator"/>
      <button role="menuitem" onClick={() => openRoute('/account')}><i className="fa-solid fa-gauge-high"/><span>View Full Account</span></button>
      <button role="menuitem" className="account-dropdown-logout" onClick={() => { setOpen(false); onLogout(); }}><i className="fa-solid fa-right-from-bracket"/><span>Logout</span></button>
    </div>}
  </div>;
}
