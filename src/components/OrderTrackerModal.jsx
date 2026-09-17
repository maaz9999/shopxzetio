import React from 'react';
import TrackOrderForm from './TrackOrderForm';

export default function OrderTrackerModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return <div className="tracker-modal-backdrop" onClick={onClose}><div className="tracker-modal-card" onClick={(e) => e.stopPropagation()}>
    <div className="tracker-modal-header"><div className="tracker-header-left"><div className="tracker-icon-badge"><i className="fa-solid fa-truck-fast"/></div><div><h3 className="tracker-title">LIVE ORDER & COURIER TRACKING</h3><p className="tracker-subtitle">Customers and guests can track securely</p></div></div><button className="tracker-close-btn" onClick={onClose}><i className="fa-solid fa-xmark"/></button></div>
    <TrackOrderForm/>
  </div></div>;
}
