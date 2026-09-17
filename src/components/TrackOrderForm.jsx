import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const stages = ['placed', 'confirmed', 'processing', 'dispatched', 'delivered'];
const labels = { placed: 'Order Placed', confirmed: 'Confirmed', processing: 'Processing', dispatched: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

export function OrderTrackingProgress({ status }) {
  const statusIndex = stages.indexOf(status);
  const cancelled = status === 'cancelled';
  return <div className={`tracker-stepper ${cancelled ? 'is-cancelled' : ''}`}>{stages.map((stage, index) => <React.Fragment key={stage}><div className={`step-item ${!cancelled && index <= statusIndex ? 'step-done' : ''}`}><div className="step-dot"><i className={`fa-solid ${!cancelled && index <= statusIndex ? 'fa-check' : 'fa-circle'}`}/></div><span className="step-label">{labels[stage]}</span></div>{index < stages.length - 1 && <div className={`step-line ${!cancelled && index < statusIndex ? 'step-done' : ''}`}/>}</React.Fragment>)}</div>;
}

export default function TrackOrderForm() {
  const [orderRef, setOrderRef] = useState('');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (event) => {
    event.preventDefault();
    setBusy(true); setError(''); setResult(null);
    const { data, error: lookupError } = await supabase.rpc('track_shop_order', { p_order_ref: orderRef.trim(), p_contact: contact.trim() });
    if (lookupError) setError(lookupError.message);
    else if (!data) setError('No matching order was found. Check the Order ID and use the same email or phone entered at checkout.');
    else setResult(data);
    setBusy(false);
  };

  return <div className="track-order-form-shell">
    <form onSubmit={search} className="tracker-search-form tracker-two-fields">
      <label><span>Order ID</span><input required value={orderRef} onChange={(event) => setOrderRef(event.target.value)} placeholder="SXZ-10001" className="tracker-input" autoComplete="off"/></label>
      <label><span>Checkout email or phone</span><input required value={contact} onChange={(event) => setContact(event.target.value)} placeholder="you@email.com or 03…" className="tracker-input" autoComplete="email"/></label>
      <button disabled={busy} className="btn-tracker-submit"><i className="fa-solid fa-magnifying-glass-location"/> {busy ? 'Checking…' : 'Track Order'}</button>
    </form>
    {error && <div className="auth-alert error" role="alert">{error}</div>}
    {result && <div className="tracker-result-box" aria-live="polite"><div className="tracker-result-header"><div><span className="tracker-order-id">{result.order_ref}</span><span className="tracker-order-date">Placed {new Date(result.created_at).toLocaleDateString()}</span></div><span className="tracker-status-badge">{labels[result.order_status] || result.order_status}</span></div>
      <OrderTrackingProgress status={result.order_status}/>
      <div className="tracker-details-card"><div className="detail-row"><span>Payment:</span><strong>{result.payment_status}</strong></div><div className="detail-row"><span>Courier:</span><strong>{result.courier || 'Awaiting dispatch'}</strong></div><div className="detail-row"><span>Tracking number:</span><strong>{result.tracking_number || 'Not assigned'}</strong></div><div className="detail-row"><span>Destination:</span><strong>{result.city}</strong></div><div className="detail-row"><span>Total:</span><strong>Rs. {Number(result.total).toLocaleString()}</strong></div></div>
      <a href={`https://wa.me/923348590229?text=${encodeURIComponent(`Hello ShopXzetio, please help with ${result.order_ref}`)}`} target="_blank" rel="noreferrer" className="btn-tracker-wa"><i className="fa-brands fa-whatsapp"/> Chat with Dispatcher</a>
    </div>}
  </div>;
}
