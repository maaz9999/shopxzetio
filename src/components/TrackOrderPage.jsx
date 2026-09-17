import React from 'react';
import { Link } from 'react-router-dom';
import TrackOrderForm from './TrackOrderForm';

export default function TrackOrderPage() {
  return <main className="account-shell public-tracking-page">
    <section className="public-tracking-card">
      <Link to="/" className="auth-back"><i className="fa-solid fa-arrow-left"/> Return to Store</Link>
      <div className="tracker-page-heading"><div className="tracker-icon-badge"><i className="fa-solid fa-box-location-dot"/></div><div><p className="auth-kicker">// DELIVERY INTELLIGENCE</p><h1>TRACK YOUR ORDER</h1><span>Enter the Order ID from your confirmation and the same email or phone used at checkout.</span></div></div>
      <TrackOrderForm/>
    </section>
  </main>;
}
