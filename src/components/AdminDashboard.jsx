import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PAYMENT_LABELS } from '../services/orders';
import AdminProducts from './AdminProducts';
import { AdminCustomers, AdminReviews } from './AdminManagement';

const ORDER_STATUS_LABELS = {
  placed: 'Order Placed', confirmed: 'Confirmed', processing: 'Processing',
  dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function AdminDashboard() {
  const { setCurrentView } = useCart();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom cyber toast notification & confirm modal state
  const [adminToast, setAdminToast] = useState(null);
  const [confirmDeleteRef, setConfirmDeleteRef] = useState(null);

  const triggerToast = (msg, icon = 'fa-circle-check', type = 'success') => {
    setAdminToast({ msg, icon, type });
    setTimeout(() => {
      setAdminToast(null);
    }, 3500);
  };

  // Lightbox
  const [activeSSOrder, setActiveSSOrder] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const loadOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*, order_items(*), payments(*)').order('created_at', { ascending: false });
    if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
    const mapped = await Promise.all((data || []).map(async (o) => {
      const payment = o.payments?.[0];
      let receiptDataUrl = null;
      if (payment?.receipt_path) {
        const signed = await supabase.storage.from('payment-receipts').createSignedUrl(payment.receipt_path, 900);
        receiptDataUrl = signed.data?.signedUrl || null;
      }
      return { id: o.id, orderRef: o.order_ref, date: o.created_at, customer: { fullName: o.customer_name, email: o.customer_email, whatsapp: o.customer_phone, address: o.address_line, city: o.city, notes: o.delivery_notes }, paymentMethod: PAYMENT_LABELS[o.payment_method], paymentCode: o.payment_method, items: o.order_items.map(i => ({ name: i.product_name, price: Number(i.unit_price), quantity: i.quantity })), subtotal: Number(o.subtotal), shipping: Number(o.shipping_amount), total: Number(o.total_amount), hasReceipt: Boolean(payment?.receipt_path), receiptDataUrl, paymentId: payment?.id, paymentStatus: payment?.status || o.payment_status, orderStatus: o.order_status, status: ORDER_STATUS_LABELS[o.order_status] || o.order_status, trackingNumber: o.tracking_number || '', courier: o.courier || '' };
    }));
    setOrders(mapped);
  };

  useEffect(() => { loadOrders(); }, []);

  const handleLogout = async () => { await logout(); window.location.href = '/admin/login'; };

  const updateOrderStatus = async (orderRef, dbStatus) => {
    const order = orders.find(o => o.orderRef === orderRef);
    let { error } = await supabase.rpc('admin_update_order', { p_order_id: order.id, p_order_status: dbStatus, p_message: `Order marked ${ORDER_STATUS_LABELS[dbStatus]}` });
    if (error?.code === 'PGRST202') ({ error } = await supabase.from('orders').update({ order_status: dbStatus }).eq('id', order.id));
    if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
    await loadOrders();
    triggerToast(`Order #${orderRef} updated to ${ORDER_STATUS_LABELS[dbStatus]}`, 'fa-arrows-rotate', 'info');
  };

  const updateOrderTracking = async (orderRef, tracking, courier) => {
    const order = orders.find(o => o.orderRef === orderRef);
    const nextCourier = courier || order.courier || 'TCS Pakistan';
    let { error } = await supabase.rpc('admin_update_order', { p_order_id: order.id, p_courier: nextCourier, p_tracking_number: tracking, p_message: 'Courier details updated' });
    if (error?.code === 'PGRST202') ({ error } = await supabase.from('orders').update({ tracking_number: tracking, courier: nextCourier }).eq('id', order.id));
    if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
    await loadOrders();
    triggerToast(`Tracking ID saved for #${orderRef}`, 'fa-truck-fast', 'info');
  };

  const updatePaymentStatus = async (order, paymentStatus) => {
    let { error } = await supabase.rpc('admin_update_order', {
      p_order_id: order.id,
      p_order_status: paymentStatus === 'verified' && order.orderStatus === 'placed' ? 'confirmed' : null,
      p_payment_status: paymentStatus,
      p_message: paymentStatus === 'verified' ? 'Payment verified by ShopXzetio' : 'Payment receipt rejected',
    });
    if (error?.code === 'PGRST202') {
      const paymentResult = await supabase.from('payments').update({ status: paymentStatus, amount_received: paymentStatus === 'verified' ? (order.paymentCode === 'cod_advance' ? 500 : order.total) : 0, verified_at: paymentStatus === 'verified' ? new Date().toISOString() : null }).eq('id', order.paymentId);
      error = paymentResult.error;
      if (!error) await supabase.from('orders').update({ payment_status: paymentStatus, ...(paymentStatus === 'verified' && order.orderStatus === 'placed' ? { order_status: 'confirmed' } : {}) }).eq('id', order.id);
    }
    if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
    await loadOrders();
    triggerToast(paymentStatus === 'verified' ? 'Payment verified.' : 'Payment receipt rejected.', paymentStatus === 'verified' ? 'fa-check-double' : 'fa-xmark', paymentStatus === 'verified' ? 'success' : 'danger');
  };

  const deleteOrder = (orderRef) => {
    setConfirmDeleteRef(orderRef);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteRef) {
      const order = orders.find(o => o.orderRef === confirmDeleteRef);
      const { error } = await supabase.from('orders').update({ order_status: 'cancelled' }).eq('id', order.id);
      if (error) return triggerToast(error.message, 'fa-triangle-exclamation', 'danger');
      await loadOrders();
      triggerToast(`Order #${confirmDeleteRef} cancelled and retained for audit.`, 'fa-ban', 'danger');
      setConfirmDeleteRef(null);
    }
  };

  const chatWhatsApp = (order) => {
    let phone = order.customer.whatsapp.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '92' + phone.substring(1);

    let text = `Salam ${order.customer.fullName}!\n`;
    text += `This is ShopXzetio Pakistan regarding your order #${order.orderRef}.\n\n`;
    text += `Current Order Status: *${order.status}*\n`;
    if (order.trackingNumber) {
      text += `Tracking Number: *${order.trackingNumber}* (${order.courier || 'TCS'})\n`;
    }
    text += `Total Amount: Rs. ${order.total.toLocaleString()}\n\n`;
    text += `If you have any questions, feel free to reply directly to this message. Thank you for choosing ShopXzetio!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const exportCSV = () => {
    if (orders.length === 0) {
      triggerToast('No orders available to export.', 'fa-file-excel', 'info');
      return;
    }
    let csv = 'Order Ref,Date,Customer Name,Phone,Email,City,Address,Total (PKR),Payment Method,Status,Has Receipt,Tracking Number\n';
    filteredOrders.forEach(o => {
      const cleanAddress = (o.customer.address || '').replace(/"/g, '""');
      csv += `"${o.orderRef}","${o.date}","${o.customer.fullName}","${o.customer.whatsapp}","${o.customer.email || ''}","${o.customer.city}","${cleanAddress}",${o.total},"${o.paymentMethod}","${o.status}","${o.hasReceipt ? 'YES' : 'NO'}","${o.trackingNumber || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SHOPXZETIO_ORDERS_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Order ledger exported to CSV successfully!', 'fa-file-csv', 'success');
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeFilter === 'receipts' && (!o.hasReceipt || o.paymentStatus !== 'receipt_submitted')) return false;
      if (activeFilter === 'verified' && o.paymentStatus !== 'verified') return false;
      if (activeFilter === 'cod' && o.paymentCode !== 'cod') return false;
      if (activeFilter === 'dispatched' && o.status !== 'Dispatched') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refMatch = o.orderRef.toLowerCase().includes(q);
        const nameMatch = o.customer.fullName.toLowerCase().includes(q);
        const phoneMatch = o.customer.whatsapp.toLowerCase().includes(q);
        const cityMatch = o.customer.city.toLowerCase().includes(q);
        if (!refMatch && !nameMatch && !phoneMatch && !cityMatch) return false;
      }
      return true;
    });
  }, [orders, activeFilter, searchQuery]);

  const handleGoToStorefront = () => {
    window.location.hash = '';
    window.location.href = '/';
  };

  // Dashboard calculations
  const totalRevenue = orders.filter((o) => o.paymentStatus === 'verified' || (o.paymentCode === 'cod' && o.orderStatus === 'delivered')).reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingReceipts = orders.filter(o => o.hasReceipt && o.paymentStatus === 'receipt_submitted').length;
  const dispatchedCount = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length;

  return (
    <div className="admin-dashboard-shell">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-nav">
          <div className="admin-brand">
            <img src="/assets/brand/LOGO.png" alt="ShopXzetio Logo" className="admin-logo" />
            <div className="admin-title-group">
              <span className="admin-title">SHOP<span>XZETIO</span> ADMIN</span>
              <span className="admin-badge-status">Command Center Active</span>
            </div>
          </div>

          <div className="admin-top-actions">
            <button onClick={() => setActiveSection('orders')} className={`admin-btn ${activeSection === 'orders' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}>
              <i className="fa-solid fa-box-archive"></i> Orders
            </button>
            <button onClick={() => setActiveSection('products')} className={`admin-btn ${activeSection === 'products' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}>
              <i className="fa-solid fa-gamepad"></i> Products
            </button>
            <button onClick={() => setActiveSection('customers')} className={`admin-btn ${activeSection === 'customers' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}>
              <i className="fa-solid fa-users"></i> Customers
            </button>
            <button onClick={() => setActiveSection('reviews')} className={`admin-btn ${activeSection === 'reviews' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}>
              <i className="fa-solid fa-star"></i> Reviews
            </button>
            <button 
              onClick={handleGoToStorefront} 
              className="admin-btn admin-btn-secondary" 
              title="Return to Storefront"
            >
              <i className="fa-solid fa-store"></i> Storefront
            </button>
            <button 
              onClick={exportCSV} 
              className="admin-btn admin-btn-secondary" 
              title="Export Orders as CSV"
            >
              <i className="fa-solid fa-file-excel"></i> Export CSV
            </button>
            <button 
              onClick={handleLogout} 
              className="admin-btn admin-btn-danger" 
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket"></i> Lock
            </button>
          </div>
        </div>
      </header>

      {activeSection === 'products' && <main className="admin-container">
        <AdminProducts triggerToast={triggerToast}/>
      </main>}
      {activeSection === 'customers' && <main className="admin-container"><AdminCustomers triggerToast={triggerToast}/></main>}
      {activeSection === 'reviews' && <main className="admin-container"><AdminReviews triggerToast={triggerToast}/></main>}

      {/* Main Container */}
      <main className="admin-container" style={{ display: activeSection === 'orders' ? 'block' : 'none' }}>
        {/* Stats Grid */}
        <section className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-title">GROSS SALES VOLUME</span>
              <div className="stat-icon cyan"><i className="fa-solid fa-coins"></i></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--admin-cyan)' }}>Rs. {totalRevenue.toLocaleString()}</div>
            <div className="stat-subtext">All submitted orders in pipeline</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-title">TOTAL ORDERS</span>
              <div className="stat-icon blue"><i className="fa-solid fa-box-archive"></i></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--admin-blue)' }}>{orders.length}</div>
            <div className="stat-subtext">Lifetime store bookings</div>
          </div>

          <div className="stat-card" style={{ borderColor: 'rgba(255, 184, 0, 0.6)', background: 'linear-gradient(135deg, rgba(32, 28, 16, 0.95) 0%, rgba(18, 16, 10, 0.98) 100%)' }}>
            <div className="stat-card-header">
              <span className="stat-title" style={{ color: 'var(--admin-amber)' }}>AWAITING SS REVIEW</span>
              <div className="stat-icon amber"><i className="fa-solid fa-image"></i></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--admin-amber)' }}>{pendingReceipts}</div>
            <div className="stat-subtext">Advance payment receipts to confirm</div>
          </div>

          <div className="stat-card" style={{ borderColor: 'rgba(0, 255, 157, 0.5)' }}>
            <div className="stat-card-header">
              <span className="stat-title" style={{ color: 'var(--admin-green)' }}>DISPATCHED / DELIVERED</span>
              <div className="stat-icon green"><i className="fa-solid fa-truck-fast"></i></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--admin-green)' }}>{dispatchedCount}</div>
            <div className="stat-subtext">Packages in transit across Pakistan</div>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <section className="admin-toolbar">
          <div className="toolbar-top">
            <div className="admin-search-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                className="admin-search-input" 
                placeholder="Search by customer name, phone, order ref (#SXZ-...), city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={loadOrders} className="admin-btn admin-btn-primary" type="button">
              <i className="fa-solid fa-rotate"></i> Refresh Orders
            </button>
          </div>

          <div className="toolbar-status-pills">
            <button 
              className={`admin-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <i className="fa-solid fa-layer-group"></i> All Orders <span className="pill-count">{orders.length}</span>
            </button>
            <button 
              className={`admin-pill alert ${activeFilter === 'receipts' ? 'active' : ''}`}
              onClick={() => setActiveFilter('receipts')}
            >
              <i className="fa-solid fa-receipt"></i> Receipts To Verify <span className={`pill-count ${pendingReceipts > 0 ? 'badge-alert' : ''}`}>{pendingReceipts}</span>
            </button>
            <button 
              className={`admin-pill ${activeFilter === 'verified' ? 'active' : ''}`}
              onClick={() => setActiveFilter('verified')}
            >
              <i className="fa-solid fa-circle-check"></i> Payment Verified <span className="pill-count">{orders.filter(o => o.paymentStatus === 'verified').length}</span>
            </button>
            <button 
              className={`admin-pill ${activeFilter === 'cod' ? 'active' : ''}`}
              onClick={() => setActiveFilter('cod')}
            >
              <i className="fa-solid fa-money-bill-wave"></i> Full COD <span className="pill-count">{orders.filter(o => o.paymentCode === 'cod').length}</span>
            </button>
            <button 
              className={`admin-pill ${activeFilter === 'dispatched' ? 'active' : ''}`}
              onClick={() => setActiveFilter('dispatched')}
            >
              <i className="fa-solid fa-truck-fast"></i> Dispatched <span className="pill-count">{orders.filter(o => o.status === 'Dispatched').length}</span>
            </button>
          </div>
        </section>

        {/* Orders Table */}
        <section className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Customer Information</th>
                <th>Ordered Items</th>
                <th>Total Amount</th>
                <th>Payment Screenshot (SS)</th>
                <th>Order Status & Courier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const dateObj = new Date(order.date);
                  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  const initials = (order.customer.fullName || 'User')
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  let statusClass = 'status-pending';
                  if (order.status === 'Advance Verified') statusClass = 'status-verified';
                  else if (order.status === 'Dispatched') statusClass = 'status-dispatched';
                  else if (order.status === 'Delivered') statusClass = 'status-delivered';
                  else if (order.status === 'Cancelled') statusClass = 'status-cancelled';

                  return (
                    <tr key={order.orderRef} className={`order-row ${order.receiptDataUrl && order.paymentStatus === 'receipt_submitted' ? 'row-highlight-review' : ''}`}>
                      {/* 1. Order ID & Date */}
                      <td>
                        <div className="order-ref-badge">
                          <i className="fa-solid fa-hashtag"></i>{order.orderRef}
                        </div>
                        <div className="order-time-meta">
                          <span>{dateStr}</span> • <span>{timeStr}</span>
                        </div>
                        <div className={`order-payment-pill ${order.paymentCode === 'cod_advance' ? 'pill-advance' : ''}`}>
                          {order.paymentMethod || 'Cash On Delivery'}
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td>
                        <div className="customer-info-cell">
                          <div className="customer-avatar">{initials}</div>
                          <div className="customer-text-meta">
                            <div className="customer-name-heading">{order.customer.fullName}</div>
                            <a 
                              href={`https://wa.me/92${order.customer.whatsapp.replace(/\D/g, '').replace(/^0+/, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="customer-wa-pill"
                            >
                              <i className="fa-brands fa-whatsapp"></i> {order.customer.whatsapp}
                            </a>
                            <div className="customer-loc-pill" title={`${order.customer.address}, ${order.customer.city}`}>
                              <i className="fa-solid fa-location-dot"></i> {order.customer.city}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Items */}
                      <td>
                        <div className="order-items-wrapper">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="order-item-chip">
                              <span className="item-chip-qty">{it.quantity}x</span>
                              <span className="item-chip-name">{it.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* 4. Financials */}
                      <td>
                        <div className="order-price-display">
                          Rs. {order.total.toLocaleString()}
                        </div>
                        {order.paymentCode === 'cod_advance' && (
                          <div className="finance-breakdown-row">
                            <span className="badge-adv-paid">✓ Adv: Rs. 500</span>
                            <span className="badge-cod-due">COD: Rs. {(order.total - 500).toLocaleString()}</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Screenshot (SS) */}
                      <td>
                        {order.receiptDataUrl ? (
                          <button 
                            className={`ss-preview-card ${order.paymentStatus === 'receipt_submitted' ? 'glow-amber' : 'glow-cyan'}`}
                            onClick={() => { setActiveSSOrder(order); setZoomLevel(1); }}
                          >
                            <div className="ss-thumb-wrapper">
                              <img src={order.receiptDataUrl} className="ss-thumb-img" alt="SS" />
                              <div className="ss-hover-lens"><i className="fa-solid fa-magnifying-glass-plus"></i></div>
                            </div>
                            <span className="ss-btn-label">View Receipt</span>
                          </button>
                        ) : (
                          <div className="no-ss-pill">
                            <i className="fa-solid fa-money-bill-1"></i> No Advance
                          </div>
                        )}
                      </td>

                      {/* 6. Status & Courier */}
                      <td>
                        <div className="status-selector-wrap">
                          <select 
                            className={`status-select-enhanced ${statusClass}`}
                            value={order.orderStatus}
                            onChange={(e) => updateOrderStatus(order.orderRef, e.target.value)}
                          >
                            <option value="placed">🟡 Order Placed</option>
                            <option value="confirmed">⚪ Confirmed</option>
                            <option value="processing">🟠 Processing</option>
                            <option value="dispatched">🔵 Dispatched</option>
                            <option value="delivered">🟣 Delivered</option>
                            <option value="cancelled">🔴 Cancelled</option>
                          </select>
                          <select
                            className="tracking-code-field"
                            value={order.courier || ''}
                            onChange={(e) => updateOrderTracking(order.orderRef, order.trackingNumber, e.target.value)}
                            aria-label="Courier"
                          >
                            <option value="">Select courier</option>
                            <option value="TCS Pakistan">TCS Pakistan</option>
                            <option value="Leopards Courier">Leopards Courier</option>
                            <option value="M&P Courier">M&P Courier</option>
                            <option value="PostEx">PostEx</option>
                            <option value="Trax">Trax</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="tracking-input-group">
                            <i className="fa-solid fa-truck-fast"></i>
                            <input 
                              type="text" 
                              defaultValue={order.trackingNumber || ''} 
                              placeholder="Tracking ID..." 
                              onBlur={(e) => { if (e.target.value !== order.trackingNumber) updateOrderTracking(order.orderRef, e.target.value, order.courier); }}
                              className="tracking-code-field"
                            />
                          </div>
                        </div>
                      </td>

                      {/* 7. Actions */}
                      <td>
                        <div className="table-actions-cell">
                          <button 
                            className="btn-action-chat" 
                            onClick={() => chatWhatsApp(order)} 
                            title="Message Customer on WhatsApp"
                          >
                            <i className="fa-brands fa-whatsapp"></i>
                            <span>Chat</span>
                          </button>
                          <button 
                            className="btn-action-delete" 
                            onClick={() => deleteOrder(order.orderRef)} 
                            title="Cancel Order"
                          >
                            <i className="fa-solid fa-ban"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="table-empty-state">
                    <div className="empty-icon-wrap">
                      <i className="fa-solid fa-folder-open"></i>
                    </div>
                    <h4>NO MATCHING ORDERS</h4>
                    <p>No customer orders match the selected filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {/* Screenshot Lightbox Modal */}
      {activeSSOrder && (
        <div className="ss-lightbox-backdrop active" onClick={(e) => { if (e.target.classList.contains('ss-lightbox-backdrop')) setActiveSSOrder(null); }}>
          <div className="ss-lightbox-modal">
            <div className="ss-lightbox-header">
              <h3 className="ss-lightbox-title">
                PAYMENT SCREENSHOT #{activeSSOrder.orderRef}
              </h3>
              <button 
                onClick={() => setActiveSSOrder(null)} 
                style={{ background: 'transparent', color: 'var(--admin-text-dim)', fontSize: '1.4rem', cursor: 'pointer', border: 'none' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="ss-lightbox-image-area">
              <img 
                src={activeSSOrder.receiptDataUrl} 
                alt="Payment Slip Full" 
                className="ss-full-img"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            <div className="ss-lightbox-footer">
              <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                <div><strong>Customer:</strong> {activeSSOrder.customer.fullName} ({activeSSOrder.customer.whatsapp})</div>
                <div><strong>Total:</strong> Rs. {activeSSOrder.total.toLocaleString()} | <strong>Mode:</strong> {activeSSOrder.paymentMethod}</div>
                <div style={{ marginTop: '4px' }}><strong>Order:</strong> <span style={{ color: 'var(--admin-cyan)' }}>{activeSSOrder.status}</span> · <strong>Payment:</strong> {activeSSOrder.paymentStatus?.replaceAll('_', ' ')}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginRight: '12px', background: 'rgba(0,0,0,0.4)', padding: '4px 6px', borderRadius: '4px' }}>
                  <button 
                    className="admin-btn admin-btn-secondary" 
                    style={{ height: '30px', width: '30px', padding: 0, justifyContent: 'center' }} 
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <button 
                    className="admin-btn admin-btn-secondary" 
                    style={{ height: '30px', padding: '0 8px', fontSize: '0.75rem' }} 
                    onClick={() => setZoomLevel(1)}
                  >
                    100%
                  </button>
                  <button 
                    className="admin-btn admin-btn-secondary" 
                    style={{ height: '30px', width: '30px', padding: 0, justifyContent: 'center' }} 
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>

                <button 
                  className="admin-btn admin-btn-primary" 
                  style={{ background: 'var(--admin-green)', color: '#02070D' }}
                  onClick={() => {
                    updatePaymentStatus(activeSSOrder, 'verified');
                    setActiveSSOrder(null);
                  }}
                >
                  <i className="fa-solid fa-check-double"></i> Mark Advance Verified
                </button>

                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => {
                    updatePaymentStatus(activeSSOrder, 'rejected');
                    setActiveSSOrder(null);
                  }}
                >
                  <i className="fa-solid fa-xmark"></i> Reject Receipt
                </button>

                <button 
                  className="admin-btn admin-btn-secondary" 
                  style={{ color: 'var(--admin-green)', borderColor: 'rgba(37, 211, 102, 0.4)' }}
                  onClick={() => chatWhatsApp(activeSSOrder)}
                >
                  <i className="fa-brands fa-whatsapp"></i> Chat WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cyber Toast Notification */}
      {adminToast && (
        <div className={`cyber-admin-toast toast-${adminToast.type}`}>
          <i className={`fa-solid ${adminToast.icon}`}></i>
          <span>{adminToast.msg}</span>
        </div>
      )}

      {/* Custom Cyber Confirmation Modal */}
      {confirmDeleteRef && (
        <div className="cyber-confirm-backdrop" onClick={(e) => { if (e.target.classList.contains('cyber-confirm-backdrop')) setConfirmDeleteRef(null); }}>
          <div className="cyber-confirm-card">
            <div className="confirm-icon-box">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="confirm-title">CANCEL ORDER</div>
            <div className="confirm-desc">
              Cancel order <strong style={{ color: 'var(--admin-cyan)' }}>#{confirmDeleteRef}</strong>? The record will be retained for reporting and customer support.
            </div>
            <div className="confirm-actions">
              <button className="confirm-btn-cancel" onClick={() => setConfirmDeleteRef(null)}>
                CANCEL
              </button>
              <button className="confirm-btn-delete" onClick={handleConfirmDelete}>
                CANCEL ORDER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
