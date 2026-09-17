import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal() {
  const { isSuccessOpen, closeSuccess, completedOrder } = useCart();
  const navigate = useNavigate();

  if (!isSuccessOpen || !completedOrder) return null;

  const order = completedOrder;

  const downloadInvoice = () => {
    let invoice = `=================================================================\n`;
    invoice += `                SHOPXZETIO PAKISTAN - OFFICIAL INVOICE          \n`;
    invoice += `          Tournament-Grade Esports Hardware & Peripherals       \n`;
    invoice += `=================================================================\n\n`;
    invoice += `ORDER REFERENCE:  #${order.orderRef}\n`;
    invoice += `ORDER DATE:       ${new Date().toLocaleString()}\n`;
    invoice += `PAYMENT METHOD:   ${order.paymentMethod}\n`;
    invoice += `SUPPORT WHATSAPP: +92 334 8590229\n`;
    invoice += `INSTAGRAM:        @shopxzetio_\n\n`;
    invoice += `-----------------------------------------------------------------\n`;
    invoice += `CUSTOMER DISPATCH DETAILS\n`;
    invoice += `-----------------------------------------------------------------\n`;
    invoice += `Name:             ${order.customer.fullName}\n`;
    invoice += `WhatsApp / Tel:   ${order.customer.whatsapp}\n`;
    invoice += `Email:            ${order.customer.email || 'N/A'}\n`;
    invoice += `Shipping Address: ${order.customer.address}, ${order.customer.city}\n`;
    if (order.customer.notes) {
      invoice += `Notes:            ${order.customer.notes}\n`;
    }
    invoice += `\n-----------------------------------------------------------------\n`;
    invoice += `ITEMIZED ORDER ARSENAL\n`;
    invoice += `-----------------------------------------------------------------\n`;
    order.items.forEach((it, i) => {
      invoice += `${i + 1}. ${it.name}\n`;
      invoice += `   Qty: ${it.quantity}  x  Rs. ${it.price.toLocaleString()}  =  Rs. ${(it.price * it.quantity).toLocaleString()}\n`;
    });
    invoice += `\n-----------------------------------------------------------------\n`;
    invoice += `FINANCIAL SUMMARY\n`;
    invoice += `-----------------------------------------------------------------\n`;
    invoice += `Subtotal:         Rs. ${order.subtotal.toLocaleString()}\n`;
    invoice += `Shipping (PK):    ${order.shipping === 0 ? 'FREE' : 'Rs. ' + order.shipping.toLocaleString()}\n`;
    invoice += `GRAND TOTAL:      Rs. ${order.total.toLocaleString()}\n`;
    if (order.paymentCode === 'cod_advance') {
      invoice += `Advance Paid:     Rs. 500\n`;
      invoice += `Balance on COD:   Rs. ${(order.total - 500).toLocaleString()}\n`;
    }
    invoice += `\n=================================================================\n`;
    invoice += `7 DAYS CHECKING WARRANTY | OFFICIAL SERIAL VERIFIED HARDWARE   \n`;
    invoice += `Thank you for choosing ShopXzetio - Pakistan's Elite Gaming Store\n`;
    invoice += `=================================================================\n`;

    const blob = new Blob([invoice], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SHOPXZETIO_INVOICE_${order.orderRef}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop active" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) closeSuccess(); }}>
      <div className="modal-content-cyber" style={{ maxWidth: '520px', textAlign: 'center', padding: '40px 30px' }}>
        <button className="modal-close-btn" onClick={closeSuccess} aria-label="Close Confirmation">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={{ width: '70px', height: '70px', background: 'rgba(0, 255, 157, 0.1)', border: '2px solid var(--green-tourney)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--green-tourney)', margin: '0 auto 20px auto', boxShadow: '0 0 25px rgba(0, 255, 157, 0.3)' }}>
          <i className="fa-solid fa-check"></i>
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', marginBottom: '6px' }}>
          ORDER REGISTERED
        </h3>

        <div style={{ fontFamily: 'var(--font-digital)', fontSize: '1.6rem', color: 'var(--cyan)', marginBottom: '16px' }}>
          #{order.orderRef}
        </div>

        <div style={{ marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-soft)' }}>
          <p>Thank you, <strong style={{ color: '#fff' }}>{order.customer.fullName}</strong>! Your order has been placed in queue.</p>
          <p style={{ marginTop: '6px' }}>Total: <strong style={{ color: 'var(--cyan)' }}>Rs. {order.total.toLocaleString()}</strong> ({order.paymentMethod}).</p>
          <p style={{ marginTop: '6px' }}>Payment: <strong>{order.paymentStatus?.replace('_', ' ') || 'pending'}</strong>. Track anytime using this Order ID plus your checkout phone or email.</p>
          <p style={{ marginTop: '6px' }}>Click below to dispatch your order details instantly to our WhatsApp logistics team.</p>
        </div>
        {order.warning && <div className="auth-alert error" style={{ marginBottom: '18px', textAlign: 'left' }}>{order.warning}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {order.whatsappUrl && (
            <button 
              onClick={() => window.open(order.whatsappUrl, '_blank')}
              className="btn-whatsapp-direct cyber-cut-sm" 
              style={{ height: '50px', fontSize: '0.95rem' }}
            >
              <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }}></i> CONFIRM & SEND VIA WHATSAPP
            </button>
          )}

          <button 
            type="button" 
            onClick={downloadInvoice}
            className="btn-cyber-secondary cyber-cut-sm" 
            style={{ height: '44px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-file-invoice"></i> DOWNLOAD OFFICIAL INVOICE (.TXT)
          </button>
          {order.isGuest && <button type="button" onClick={() => { closeSuccess(); navigate('/signup?return=/account'); }} className="btn-cyber-secondary cyber-cut-sm" style={{ height: '44px' }}>
            <i className="fa-solid fa-user-plus"></i> CREATE AN ACCOUNT (OPTIONAL)
          </button>}
        </div>
      </div>
    </div>
  );
}
