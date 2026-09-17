import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { fetchMyOrders, PAYMENT_LABELS } from '../services/orders';
import TrackOrderForm, { OrderTrackingProgress } from './TrackOrderForm';

const emptyAddress = { label: 'Home', full_name: '', phone: '', address_line: '', city: '', province: '', postal_code: '', delivery_notes: '', is_default: false };
const sections = [
  ['overview', 'fa-gauge-high', 'Overview', '/account'],
  ['orders', 'fa-box', 'My Orders', '/account/orders'],
  ['track', 'fa-location-crosshairs', 'Track Order', '/account/track'],
  ['wishlist', 'fa-heart', 'Wishlist', '/account/wishlist'],
  ['addresses', 'fa-location-dot', 'Addresses', '/account/addresses'],
  ['notifications', 'fa-bell', 'Notifications', '/account/notifications'],
  ['profile', 'fa-user', 'Profile', '/account/profile'],
  ['reviews', 'fa-star', 'Reviews', '/account/reviews'],
];
const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;
const titleCase = (value = '') => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AccountPage() {
  const { user, profile, updateProfile, logout } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddress, setEditingAddress] = useState(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewForm, setReviewForm] = useState({ product_id: '', rating: 5, review_text: '' });

  const pathParts = location.pathname.split('/').filter(Boolean);
  const section = pathParts[1] || 'overview';
  const orderId = section === 'orders' ? pathParts[2] : null;
  const selectedOrder = orderId ? orders.find((order) => order.id === orderId || order.order_ref === orderId) : null;
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const activeOrder = orders.find((order) => !['delivered', 'cancelled'].includes(order.order_status));

  const load = async () => {
    setLoadError('');
    try {
      const [orderData, addressResult, wishlistResult, notificationResult] = await Promise.all([
        fetchMyOrders(),
        supabase.from('addresses').select('*').order('is_default', { ascending: false }),
        supabase.from('wishlist').select('product_id, products(*)').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ]);
      if (addressResult.error) throw addressResult.error;
      if (wishlistResult.error) throw wishlistResult.error;
      if (notificationResult.error) throw notificationResult.error;
      setOrders(orderData);
      setAddresses(addressResult.data || []);
      setWishlist(wishlistResult.data || []);
      setNotifications(notificationResult.data || []);
    } catch (error) {
      setLoadError(error.message || 'Your account data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => setProfileForm({ fullName: profile?.full_name || '', phone: profile?.phone || '' }), [profile]);

  const saveProfile = async (event) => {
    event.preventDefault();
    try { await updateProfile(profileForm); setNotice('Profile updated.'); } catch (error) { setNotice(error.message); }
  };
  const saveAddress = async (event) => {
    event.preventDefault();
    const payload = { ...addressForm, user_id: user.id };
    const query = editingAddress ? supabase.from('addresses').update(payload).eq('id', editingAddress) : supabase.from('addresses').insert(payload);
    const { error } = await query;
    if (error) return setNotice(error.message);
    setAddressForm(emptyAddress); setEditingAddress(null); setNotice('Address saved.'); await load();
  };
  const removeAddress = async (id) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) setNotice(error.message); else await load();
  };
  const removeWishlist = async (productId) => {
    const { error } = await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
    if (error) setNotice(error.message); else await load();
  };
  const markNotificationsRead = async () => {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    if (error) setNotice(error.message); else { setNotice('Notifications marked as read.'); await load(); }
  };

  const reviewableProducts = useMemo(() => Array.from(new Map(orders
    .filter((order) => order.order_status === 'delivered')
    .flatMap((order) => order.order_items || [])
    .filter((item) => item.product_id)
    .map((item) => [item.product_id, { id: item.product_id, name: item.product_name }])).values()), [orders]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewForm.product_id) return setNotice('Select a delivered product first.');
    const { error } = await supabase.from('reviews').insert({ user_id: user.id, product_id: reviewForm.product_id, display_name: profile?.full_name || user.email?.split('@')[0] || 'Customer', rating: Number(reviewForm.rating), review_text: reviewForm.review_text.trim(), approval_status: 'pending' });
    if (error) return setNotice(error.message);
    setReviewForm({ product_id: '', rating: 5, review_text: '' });
    setNotice('Review submitted for approval. Thank you.');
  };
  const doLogout = async () => { await logout(); navigate('/'); };

  return <main className="account-shell">
    <div className="account-heading"><div><p>// CUSTOMER COMMAND CENTER</p><h1>MY ACCOUNT</h1><span>{profile?.full_name || user.email}</span></div><Link to="/" className="btn-cyber-secondary">Continue Shopping</Link></div>
    {notice && <div className="auth-alert success" role="status">{notice}</div>}
    {loadError && <div className="auth-alert error" role="alert">{loadError} <button onClick={load}>Try again</button></div>}
    <div className="account-layout">
      <aside className="account-nav" aria-label="Account navigation">
        {sections.map(([key, icon, label, path]) => <button key={key} className={section === key ? 'active' : ''} onClick={() => navigate(path)}><i className={`fa-solid ${icon}`}/> {label}{key === 'notifications' && unreadCount > 0 && <span className="account-nav-count">{unreadCount}</span>}</button>)}
        <button onClick={doLogout}><i className="fa-solid fa-right-from-bracket"/> Logout</button>
      </aside>
      <section className="account-panel">
        {loading ? <AccountLoading/> : <>
          {section === 'overview' && <AccountDashboard orders={orders} wishlist={wishlist} addresses={addresses} unreadCount={unreadCount} activeOrder={activeOrder}/>}
          {section === 'orders' && !orderId && <OrdersList orders={orders}/>}
          {section === 'orders' && orderId && (selectedOrder ? <OrderDetails order={selectedOrder}/> : <NotFoundOrder/>)}
          {section === 'track' && <AccountTrackOrder orders={orders} activeOrder={activeOrder}/>}
          {section === 'profile' && <ProfileForm user={user} profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile}/>}
          {section === 'addresses' && <Addresses addresses={addresses} addressForm={addressForm} setAddressForm={setAddressForm} editingAddress={editingAddress} setEditingAddress={setEditingAddress} saveAddress={saveAddress} removeAddress={removeAddress}/>}
          {section === 'wishlist' && <Wishlist wishlist={wishlist} addToCart={addToCart} removeWishlist={removeWishlist}/>}
          {section === 'reviews' && <Reviews reviewableProducts={reviewableProducts} reviewForm={reviewForm} setReviewForm={setReviewForm} submitReview={submitReview}/>}
          {section === 'notifications' && <Notifications notifications={notifications} unreadCount={unreadCount} markNotificationsRead={markNotificationsRead}/>}
          {!sections.some(([key]) => key === section) && <NotFoundOrder/>}
        </>}
      </section>
    </div>
  </main>;
}

function AccountTrackOrder({ orders, activeOrder }) {
  return <>
    <div className="account-section-heading"><div><p>// LIVE LOGISTICS</p><h2>TRACK YOUR ORDER</h2></div></div>
    {activeOrder && <article className="active-order-card" style={{ marginBottom: 24 }}>
      <div className="active-order-icon"><i className="fa-solid fa-truck-fast"/></div>
      <div className="active-order-main">
        <span>ACTIVE IN-TRANSIT SHIPMENT</span>
        <h3>{activeOrder.order_ref}</h3>
        <p>Current Status: <strong>{titleCase(activeOrder.order_status)}</strong></p>
        {activeOrder.courier && <small>{activeOrder.courier}{activeOrder.tracking_number ? ` · Waybill #${activeOrder.tracking_number}` : ''}</small>}
      </div>
      <Link to={`/account/orders/${activeOrder.id}#tracking`} className="btn-cyber-primary">
        <i className="fa-solid fa-location-crosshairs"/> View Stepper
      </Link>
    </article>}
    <div style={{ maxWidth: 720 }}>
      <TrackOrderForm/>
    </div>
  </>;
}

function AccountLoading() { return <div className="account-loading" role="status"><i className="fa-solid fa-circle-notch fa-spin"/><span>Loading account data…</span></div>; }
function AccountQuickCard({ icon, title, count, action, path }) { return <Link to={path} className="account-quick-card"><i className={`fa-solid ${icon}`}/><div><h3>{title}</h3><p>{count}</p><span>{action} <i className="fa-solid fa-arrow-right"/></span></div></Link>; }

function AccountDashboard({ orders, wishlist, addresses, unreadCount, activeOrder }) {
  return <><div className="account-section-heading"><div><p>// OVERVIEW</p><h2>ACCOUNT DASHBOARD</h2></div></div>
    {activeOrder && <article className="active-order-card"><div className="active-order-icon"><i className="fa-solid fa-truck-fast"/></div><div className="active-order-main"><span>ACTIVE ORDER</span><h3>{activeOrder.order_ref}</h3><p>Current status <strong>{titleCase(activeOrder.order_status)}</strong></p>{activeOrder.courier && <small>{activeOrder.courier}{activeOrder.tracking_number ? ` · ${activeOrder.tracking_number}` : ''}</small>}</div><Link to={`/account/orders/${activeOrder.id}`} className="btn-cyber-primary"><i className="fa-solid fa-location-crosshairs"/> Track Order</Link></article>}
    <div className="account-quick-grid">
      <AccountQuickCard icon="fa-box" title="MY ORDERS" count={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`} action="View orders" path="/account/orders"/>
      <AccountQuickCard icon="fa-location-crosshairs" title="TRACK ORDER" count="Live courier tracking" action="Track shipment" path="/account/track"/>
      <AccountQuickCard icon="fa-heart" title="WISHLIST" count={`${wishlist.length} saved ${wishlist.length === 1 ? 'item' : 'items'}`} action="View wishlist" path="/account/wishlist"/>
      <AccountQuickCard icon="fa-location-dot" title="SAVED ADDRESSES" count={`${addresses.length} ${addresses.length === 1 ? 'address' : 'addresses'}`} action="Manage addresses" path="/account/addresses"/>
      <AccountQuickCard icon="fa-bell" title="NOTIFICATIONS" count={`${unreadCount} unread`} action="View notifications" path="/account/notifications"/>
    </div>
  </>;
}

function OrdersList({ orders }) {
  return <><div className="account-section-heading"><div><p>// PURCHASE HISTORY</p><h2>MY ORDERS</h2></div></div>{orders.length === 0 ? <div className="account-empty"><i className="fa-solid fa-box-open"/><h3>NO ORDERS YET</h3><p>Your orders and delivery updates will appear here once you place your first order.</p><Link to="/" className="btn-cyber-primary"><i className="fa-solid fa-cart-shopping"/> Start Shopping</Link></div> : <div className="account-list">{orders.map((order) => <OrderCard key={order.id} order={order}/>)}</div>}</>;
}
function OrderCard({ order }) {
  const canTrack = Boolean(order.tracking_number || order.courier || ['dispatched', 'delivered'].includes(order.order_status));
  const itemCount = (order.order_items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return <article className="order-list-card"><div className="order-card-primary"><span>ORDER ID</span><strong>{order.order_ref}</strong><small>{new Date(order.created_at).toLocaleDateString()}</small></div><div><span>ITEMS</span><strong>{itemCount}</strong></div><div><span>TOTAL</span><strong>{money(order.total_amount)}</strong></div><div><span>STATUS</span><em className={`order-status status-${order.order_status}`}>{titleCase(order.order_status)}</em></div><div className="order-card-actions"><Link to={`/account/orders/${order.id}`}>View Details</Link>{canTrack && <Link to={`/account/orders/${order.id}#tracking`} className="is-primary">Track Order</Link>}</div></article>;
}
function OrderDetails({ order }) {
  const history = [...(order.order_tracking || [])].sort((a, b) => new Date(b.event_time) - new Date(a.event_time));
  return <div className="order-detail"><Link className="auth-back" to="/account/orders">← All orders</Link><div className="order-detail-heading"><div><span>ORDER DETAILS</span><h2>{order.order_ref}</h2><p>Placed {new Date(order.created_at).toLocaleString()}</p></div><em className={`order-status status-${order.order_status}`}>{titleCase(order.order_status)}</em></div>
    {order.order_status === 'cancelled' ? <div className="order-cancelled"><i className="fa-solid fa-circle-xmark"/> This order has been cancelled.</div> : <div id="tracking" className="order-progress-panel"><h3>ORDER STATUS</h3><OrderTrackingProgress status={order.order_status}/></div>}
    <div className="detail-grid"><article><h3>ITEMS</h3>{(order.order_items || []).map((item) => <div className="order-detail-item" key={item.id}>{item.product_image && <img src={item.product_image} alt=""/>}<span><strong>{item.product_name}</strong><small>{item.quantity} × {money(item.unit_price)}</small></span><b>{money(item.line_total)}</b></div>)}</article><article><h3>DELIVERY ADDRESS</h3><p><strong>{order.customer_name}</strong></p><p>{order.address_line}</p><p>{order.city}{order.province ? `, ${order.province}` : ''}{order.postal_code ? ` · ${order.postal_code}` : ''}</p><p>{order.customer_phone}</p>{order.delivery_notes && <small>Note: {order.delivery_notes}</small>}</article><article><h3>PAYMENT</h3><p>{PAYMENT_LABELS[order.payment_method] || titleCase(order.payment_method)}</p><p>Status: <strong>{titleCase(order.payment_status)}</strong></p><p>Subtotal <strong>{money(order.subtotal)}</strong></p><p>Shipping <strong>{money(order.shipping_amount)}</strong></p><p className="order-total-row">Total <strong>{money(order.total_amount)}</strong></p></article><article><h3>COURIER & TRACKING</h3><p>Courier: <strong>{order.courier || 'Awaiting dispatch'}</strong></p><p>Tracking number: <strong>{order.tracking_number || 'Not assigned'}</strong></p>{order.tracking_number && <a href={`https://wa.me/923348590229?text=${encodeURIComponent(`Hello ShopXzetio, please help me track ${order.order_ref} (${order.tracking_number}).`)}`} target="_blank" rel="noreferrer"><i className="fa-brands fa-whatsapp"/> Ask support</a>}</article></div>
    {history.length > 0 && <article className="tracking-history"><h3>TRACKING HISTORY</h3>{history.map((event) => <div key={event.id}><i className="fa-solid fa-circle"/><span><strong>{event.message || titleCase(event.status)}</strong><small>{new Date(event.event_time).toLocaleString()}</small></span></div>)}</article>}
  </div>;
}
function NotFoundOrder() { return <div className="account-empty"><i className="fa-solid fa-circle-exclamation"/><h3>ORDER NOT FOUND</h3><p>This order is unavailable or does not belong to your account.</p><Link to="/account/orders" className="btn-cyber-primary">Back to My Orders</Link></div>; }

function ProfileForm({ user, profileForm, setProfileForm, saveProfile }) { return <><h2>Profile Information</h2><form className="account-form" onSubmit={saveProfile}><label>Full Name<input required value={profileForm.fullName} onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })}/></label><label>Email Address<input disabled value={user.email || ''}/></label><label>Phone Number<input value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} placeholder="e.g. 03348590229"/></label><button className="btn-cyber-primary"><i className="fa-solid fa-floppy-disk"/> Save Profile</button></form></>; }
function Addresses({ addresses, addressForm, setAddressForm, editingAddress, setEditingAddress, saveAddress, removeAddress }) {
  const fields = { label: 'Label (e.g. Home, Gaming Room)', full_name: 'Full Name', phone: 'Phone Number', address_line: 'Complete Address', city: 'City', province: 'Province', postal_code: 'Postal Code', delivery_notes: 'Delivery Notes' };
  return <><h2>Saved Addresses</h2><div className="address-grid">{addresses.map((address) => <article key={address.id} className="address-card"><strong>{address.label} {address.is_default && '• Default'}</strong><p>{address.full_name} · {address.phone}</p><p>{address.address_line}, {address.city}, {address.province}</p><div><button onClick={() => { setEditingAddress(address.id); setAddressForm(address); }}><i className="fa-solid fa-pen-to-square"/> Edit</button><button onClick={() => removeAddress(address.id)}><i className="fa-solid fa-trash"/> Delete</button></div></article>)}</div><form className="account-form address-form" onSubmit={saveAddress}><h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>{Object.entries(fields).map(([key, label]) => <label key={key}>{label}<input required={['full_name', 'phone', 'address_line', 'city'].includes(key)} value={addressForm[key] || ''} onChange={(event) => setAddressForm({ ...addressForm, [key]: event.target.value })}/></label>)}<label className="check-label"><input type="checkbox" checked={addressForm.is_default} onChange={(event) => setAddressForm({ ...addressForm, is_default: event.target.checked })}/> Set as default delivery address</label><button className="btn-cyber-primary"><i className="fa-solid fa-location-dot"/> Save Address</button></form></>;
}
function Wishlist({ wishlist, addToCart, removeWishlist }) { return <><h2>Wishlist</h2>{wishlist.length === 0 ? <div className="account-empty"><i className="fa-solid fa-heart-crack"/><h3>WISHLIST IS EMPTY</h3><p>Save your favorite gaming gear for quick access.</p><Link to="/" className="btn-cyber-primary">Browse Gear</Link></div> : <div className="wishlist-grid">{wishlist.map(({ product_id: productId, products: product }) => product && <article key={productId}><img src={product.main_image} alt=""/><strong>{product.short_name || product.name}</strong><span>{money(product.price)}</span><button onClick={() => addToCart({ ...product, id: product.legacy_id })}><i className="fa-solid fa-cart-plus"/> Add to cart</button><button onClick={() => removeWishlist(productId)}><i className="fa-solid fa-trash"/> Remove</button></article>)}</div>}</>; }
function Reviews({ reviewableProducts, reviewForm, setReviewForm, submitReview }) { return <><h2>Review a Purchase</h2>{reviewableProducts.length === 0 ? <div className="account-empty"><i className="fa-solid fa-star-half-stroke"/><h3>NO DELIVERED PRODUCTS YET</h3><p>A product becomes eligible for review after its order is delivered.</p></div> : <form className="account-form review-form" onSubmit={submitReview}><label>Delivered Product<select required value={reviewForm.product_id} onChange={(event) => setReviewForm({ ...reviewForm, product_id: event.target.value })}><option value="">Select product</option>{reviewableProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Rating<select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}</select></label><label className="review-text-field">Your Review<textarea required minLength="10" value={reviewForm.review_text} onChange={(event) => setReviewForm({ ...reviewForm, review_text: event.target.value })} placeholder="Tell other players about the product…"/></label><button className="btn-cyber-primary"><i className="fa-solid fa-paper-plane"/> Submit for Approval</button></form>}</>; }
function Notifications({ notifications, unreadCount, markNotificationsRead }) { return <><div className="account-tab-heading"><h2>Notifications</h2>{unreadCount > 0 && <button className="btn-cyber-secondary" onClick={markNotificationsRead}><i className="fa-solid fa-check-double"/> Mark all read</button>}</div>{notifications.length === 0 ? <div className="account-empty"><i className="fa-solid fa-bell-slash"/><h3>NO NOTIFICATIONS</h3><p>You are all caught up with your latest order and delivery updates.</p></div> : notifications.map((item) => <article className={`notification-card ${item.read_at ? '' : 'unread'}`} key={item.id}><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small></article>)}</>; }
