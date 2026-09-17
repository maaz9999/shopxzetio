import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { buildWhatsAppUrl, createShopOrder, PAYMENT_LABELS } from '../services/orders';

const emptyForm = { name: '', phone: '', email: '', city: '', province: '', postal_code: '', address: '', notes: '' };

export default function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout, items, subtotal, shipping, total, clearCart, openSuccess } = useCart();
  const { user, profile, isCustomer, ensureGuestSession } = useAuth();
  const navigate = useNavigate();
  const [checkoutMode, setCheckoutMode] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [formData, setFormData] = useState(emptyForm);
  const [receipt, setReceipt] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previewUrl = useMemo(() => receipt ? URL.createObjectURL(receipt) : null, [receipt]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => {
    if (!isCheckoutOpen) return;
    if (isCustomer) {
      setCheckoutMode('customer');
      supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).then(({ data }) => {
        setAddresses(data || []);
        const a = data?.[0];
        setFormData((old) => ({ ...old, name: profile?.full_name || '', phone: profile?.phone || a?.phone || '', email: user.email || '', city: a?.city || '', province: a?.province || '', postal_code: a?.postal_code || '', address: a?.address_line || '', notes: a?.delivery_notes || '' }));
      });
    } else setCheckoutMode(null);
  }, [isCheckoutOpen, isCustomer, user?.id, profile]);

  if (!isCheckoutOpen) return null;
  const handleLogin = (path) => { closeCheckout(); navigate(`${path}?return=${encodeURIComponent('/?resume=checkout')}`); };
  const handleInput = (e) => setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  const applyAddress = (id) => {
    const address = addresses.find((item) => item.id === id);
    if (!address) return;
    setFormData((old) => ({ ...old, name: address.full_name || old.name, phone: address.phone || old.phone, city: address.city || '', province: address.province || '', postal_code: address.postal_code || '', address: address.address_line || '', notes: address.delivery_notes || '' }));
  };

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.city.trim() || !formData.address.trim()) return setError('Name, phone, email, city and complete address are required.');
    setBusy(true);
    try {
      if (!isCustomer) await ensureGuestSession();
      const result = await createShopOrder({ customer: formData, paymentMethod, items, receiptFile: receipt });
      const order = {
        orderRef: result.order_ref, id: result.id, date: new Date().toISOString(), customer: { fullName: formData.name, whatsapp: formData.phone, email: formData.email, city: formData.city, province: formData.province, address: formData.address, notes: formData.notes },
        paymentMethod: PAYMENT_LABELS[paymentMethod], paymentCode: paymentMethod, paymentStatus: result.receiptPath && !result.receiptError ? 'receipt_submitted' : result.payment_status,
        items: [...items], subtotal: Number(result.subtotal), shipping: Number(result.shipping), total: Number(result.total), isGuest: !isCustomer,
        warning: result.receiptError ? `Your order was created, but the receipt could not be attached: ${result.receiptError}. Please send it on WhatsApp with your Order ID.` : '',
      };
      order.whatsappUrl = buildWhatsAppUrl(order);
      clearCart(); closeCheckout(); openSuccess(order);
    } catch (err) { setError(err.message || 'Order could not be created.'); }
    finally { setBusy(false); }
  };

  return <div className="modal-backdrop active" onClick={(e) => e.target.classList.contains('modal-backdrop') && closeCheckout()}><div className="modal-content-cyber checkout-modal-content">
    <button className="modal-close-btn" onClick={closeCheckout}><i className="fa-solid fa-xmark"/></button>
    {!checkoutMode ? <div className="checkout-choice"><p className="auth-kicker">// CHECKOUT ACCESS</p><h2>HOW WOULD YOU LIKE TO CHECK OUT?</h2><p>Buy immediately as a guest, or sign in for saved addresses and order history.</p><div className="checkout-choice-grid"><button className="checkout-choice-card primary" onClick={() => setCheckoutMode('guest')}><i className="fa-solid fa-bolt"/><strong>Continue as Guest</strong><span>No account required. Track with Order ID + email/phone.</span></button><div className="checkout-choice-card"><i className="fa-solid fa-user-shield"/><strong>Customer Account</strong><span>Faster checkout and all orders in one place.</span><button onClick={() => handleLogin('/login')}>Login</button><button onClick={() => handleLogin('/signup')}>Create Account</button></div></div></div> :
    <div className="checkout-grid"><div><div className="checkout-form-heading"><button type="button" className="auth-back" onClick={() => !isCustomer && setCheckoutMode(null)}>← {isCustomer ? 'Secure customer checkout' : 'Change checkout option'}</button><h3 className="checkout-section-title"><i className="fa-solid fa-user-shield"/> DISPATCH DETAILS</h3>{isCustomer && <span className="customer-pill">Logged in as {user.email}</span>}</div>
      <form onSubmit={submit}><div className="checkout-fields">
        {isCustomer && addresses.length > 0 && <label className="form-group" style={{ gridColumn: '1 / -1' }}><span className="form-label">Use Saved Address</span><select className="form-input" defaultValue="" onChange={(e) => applyAddress(e.target.value)}><option value="">Current checkout details</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label}{address.is_default ? ' — Default' : ''}: {address.address_line}, {address.city}</option>)}</select></label>}
        {[['name','Full Name *','text'],['phone','WhatsApp / Mobile *','tel'],['email','Email Address *','email'],['city','City *','text'],['province','Province','text'],['postal_code','Postal Code','text']].map(([id,label,type]) => <label className="form-group" key={id}><span className="form-label">{label}</span><input id={id} type={type} className="form-input" value={formData[id]} onChange={handleInput}/></label>)}
      </div><label className="form-group"><span className="form-label">Complete Delivery Address *</span><textarea id="address" className="form-textarea" value={formData.address} onChange={handleInput}/></label><label className="form-group"><span className="form-label">Delivery Notes</span><input id="notes" className="form-input" value={formData.notes} onChange={handleInput}/></label>
      <h3 className="checkout-section-title"><i className="fa-solid fa-credit-card"/> PAYMENT METHOD</h3><div className="payment-methods-group">{Object.entries(PAYMENT_LABELS).map(([code,label]) => <label className={`payment-option-card ${paymentMethod === code ? 'selected' : ''}`} key={code}><input type="radio" checked={paymentMethod === code} onChange={() => setPaymentMethod(code)}/><div className="payment-option-info"><h5>{label}</h5><p>{code === 'cod' ? 'Pay the full amount to the courier.' : code === 'cod_advance' ? 'Pay Rs. 500 now and the remaining balance on delivery.' : 'Pay the full order amount online.'}</p></div></label>)}</div>
      {paymentMethod !== 'cod' && <div className="payment-receipt-upload-box"><strong>JazzCash / EasyPaisa: 0334-8590229</strong><label className="form-label">Upload Payment Screenshot / Receipt *</label><input required type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files?.[0] || null)}/>{previewUrl && <img src={previewUrl} alt="Receipt preview" className="upload-preview-img"/>}</div>}
      {error && <div className="auth-alert error">{error}</div>}<button disabled={busy} className="btn-cyber-primary cyber-cut-sm checkout-submit">{busy ? 'CREATING SECURE ORDER…' : 'PLACE ESPORTS ORDER'}</button></form></div>
      <aside><div className="order-summary-box"><h4>ORDER SUMMARY</h4>{items.map((item) => <div key={item.id} className="summary-item-row"><span>{item.quantity}× {item.name}</span><strong>Rs. {(item.price * item.quantity).toLocaleString()}</strong></div>)}<hr/><div className="cart-summary-row"><span>Subtotal</span><strong>Rs. {subtotal.toLocaleString()}</strong></div><div className="cart-summary-row"><span>Delivery</span><strong>{shipping ? `Rs. ${shipping}` : 'FREE'}</strong></div><div className="cart-summary-row total"><span>Total</span><strong>Rs. {total.toLocaleString()}</strong></div><p className="secure-note"><i className="fa-solid fa-lock"/> Order is written to Supabase before WhatsApp opens.</p></div></aside></div>}
  </div></div>;
}
