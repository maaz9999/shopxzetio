import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AdminCustomers({ triggerToast }) {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    const [profileResult, orderResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, phone, role, created_at').order('created_at', { ascending: false }),
      supabase.from('orders').select('id, customer_id, total_amount, order_status, created_at'),
    ]);
    const error = profileResult.error || orderResult.error;
    if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
    setCustomers((profileResult.data || []).filter((profile) => profile.role !== 'admin').map((profile) => ({
      ...profile,
      orders: (orderResult.data || []).filter((order) => order.customer_id === profile.id),
    })));
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => customers.filter((customer) => {
    const needle = query.toLowerCase().trim();
    return !needle || [customer.full_name, customer.email, customer.phone].some((value) => String(value || '').toLowerCase().includes(needle));
  }), [customers, query]);

  return <section className="admin-products-panel"><div className="admin-products-head"><div><p className="auth-kicker">// CUSTOMER INTELLIGENCE</p><h2>CUSTOMERS</h2><span>{customers.length} registered customer accounts</span></div></div><div className="admin-search-wrapper admin-products-search"><i className="fa-solid fa-magnifying-glass"/><input className="admin-search-input" placeholder="Search name, email or phone…" value={query} onChange={(e) => setQuery(e.target.value)}/></div><div className="orders-table-wrapper"><table className="orders-table"><thead><tr><th>Customer</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Total Spending</th><th>Latest Order</th></tr></thead><tbody>{filtered.map((customer) => {
    const orders = customer.orders || [];
    const spend = orders.filter((order) => order.order_status !== 'cancelled').reduce((sum, order) => sum + Number(order.total_amount), 0);
    const latest = [...orders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return <tr key={customer.id}><td><strong>{customer.full_name || 'Unnamed customer'}</strong><small className="admin-block-small">{customer.id.slice(0,8)}…</small></td><td>{customer.email || 'No email'}<small className="admin-block-small">{customer.phone || 'No phone'}</small></td><td>{new Date(customer.created_at).toLocaleDateString()}</td><td>{orders.length}</td><td><strong>Rs. {spend.toLocaleString()}</strong></td><td>{latest ? <><strong>{latest.order_status}</strong><small className="admin-block-small">{new Date(latest.created_at).toLocaleDateString()}</small></> : 'No orders'}</td></tr>;
  })}{filtered.length === 0 && <tr><td colSpan="6" className="table-empty-state">No matching customers.</td></tr>}</tbody></table></div></section>;
}

export function AdminReviews({ triggerToast }) {
  const [reviews, setReviews] = useState([]);
  const load = async () => {
    const { data, error } = await supabase.from('reviews').select('*, products(name)').order('created_at', { ascending: false });
    if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
    setReviews(data || []);
  };
  useEffect(() => { load(); }, []);
  const updateReview = async (review, patch) => {
    const { error } = await supabase.from('reviews').update(patch).eq('id', review.id);
    if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
    await load();
    triggerToast('Review moderation updated.');
  };
  return <section className="admin-products-panel"><div className="admin-products-head"><div><p className="auth-kicker">// COMMUNITY MODERATION</p><h2>CUSTOMER REVIEWS</h2><span>{reviews.filter((review) => review.approval_status === 'pending').length} awaiting review</span></div></div><div className="orders-table-wrapper"><table className="orders-table"><thead><tr><th>Customer</th><th>Product</th><th>Rating</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.id}><td><strong>{review.display_name || 'Customer'}</strong><small className="admin-block-small">{new Date(review.created_at).toLocaleDateString()}</small></td><td>{review.products?.name || 'Store review'}</td><td><span style={{ color:'#ffd75e' }}>{'★'.repeat(review.rating || 0)}</span></td><td><div style={{ maxWidth:320, whiteSpace:'normal' }}>{review.review_text || 'Media review'}</div></td><td><span className={`visibility-pill ${review.approval_status === 'approved' ? 'live' : ''}`}>{review.approval_status}</span>{review.is_featured && <span className="visibility-pill featured">Featured</span>}</td><td><div className="table-actions-cell"><button className="btn-action-chat" onClick={() => updateReview(review, { approval_status:'approved' })}><i className="fa-solid fa-check"/><span>Approve</span></button><button className="btn-action-delete" title="Hide review" onClick={() => updateReview(review, { approval_status:'hidden' })}><i className="fa-solid fa-eye-slash"/></button><button className="btn-action-chat" title="Feature review" onClick={() => updateReview(review, { is_featured:!review.is_featured })}><i className="fa-solid fa-star"/></button></div></td></tr>)}{reviews.length === 0 && <tr><td colSpan="6" className="table-empty-state">No customer-submitted reviews yet.</td></tr>}</tbody></table></div></section>;
}
