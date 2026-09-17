import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal() {
  const { activeDetailProduct, closeDetail, addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (activeDetailProduct) {
      const images = activeDetailProduct.images && activeDetailProduct.images.length > 0 
        ? activeDetailProduct.images 
        : [activeDetailProduct.mainImage];
      setSelectedImage(images[0] || '');
      setQuantity(1);
    }
  }, [activeDetailProduct]);

  if (!activeDetailProduct) return null;

  const product = activeDetailProduct;
  const images = product.images && product.images.length > 0 ? product.images : [product.mainImage];

  const handleWhatsAppBuy = () => {
    const totalPrice = product.price * quantity;
    const text = `*NEW ORDER INQUIRY - SHOPXZETIO PAKISTAN*\n` +
                 `--------------------------------------\n` +
                 `*Product:* ${product.name}\n` +
                 `*Quantity:* ${quantity}\n` +
                 `*Unit Price:* Rs. ${product.price.toLocaleString()}\n` +
                 `*Total Amount:* Rs. ${totalPrice.toLocaleString()}\n` +
                 `*Category:* ${product.category} (${product.subCategory || ''})\n` +
                 `--------------------------------------\n` +
                 `Hello! I would like to order this item. Please confirm stock availability and courier delivery to my city.`;
    window.open(`https://wa.me/923348590229?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    closeDetail();
  };

  return (
    <div className="modal-backdrop active" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) closeDetail(); }}>
      <div className="modal-content-cyber">
        <button className="modal-close-btn" onClick={closeDetail} aria-label="Close Product View">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="product-modal-grid">
          {/* Gallery View */}
          <div className="gallery-container">
            <div className="gallery-main-view">
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="gallery-main-img" 
                onError={(e) => { e.target.src = '/assets/brand/LOGO.png'; }}
              />
            </div>
            <div className="gallery-thumbnails-track">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`gallery-thumb ${img === selectedImage ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Details & Specs */}
          <div className="product-detail-info">
            <span className="modal-category-badge">
              {product.subCategory || product.category}
            </span>
            <h2 className="modal-product-title">{product.name}</h2>

            <div className="modal-price-area">
              <div className="modal-price-now">
                <span>Rs.</span> {(product.price).toLocaleString()}
              </div>
              {product.originalPrice && (
                <div className="modal-price-was">
                  Rs. {product.originalPrice.toLocaleString()}
                </div>
              )}
            </div>

            <p className="modal-description">{product.description}</p>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  KEY FEATURES & SPECS
                </h4>
                <ul className="modal-features-list">
                  {product.features.map((f, i) => (
                    <li key={i}>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Specs Table */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                <tbody>
                  {Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{k}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-white)', fontWeight: 600, fontSize: '0.85rem' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* What's In The Box */}
            {product.inTheBox && product.inTheBox.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  WHAT'S IN THE BOX
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {product.inTheBox.map((item, idx) => (
                    <span key={idx} style={{ background: 'rgba(0, 240, 255, 0.06)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                      <i className="fa-solid fa-box-archive" style={{ color: 'var(--cyan)', fontSize: '0.75rem', marginRight: '4px' }}></i> {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions & Quantity */}
            <div className="modal-actions-area">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '1px' }}>
                  SELECT QUANTITY:
                </span>
                <div className="qty-control-box" style={{ height: '38px' }}>
                  <button 
                    className="qty-btn" 
                    type="button" 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    style={{ width: '34px', height: '36px', fontSize: '1.1rem' }}
                  >
                    -
                  </button>
                  <span className="qty-display" style={{ padding: '0 16px', fontSize: '1.05rem', fontFamily: 'var(--font-digital)', color: '#fff' }}>
                    {quantity}
                  </span>
                  <button 
                    className="qty-btn" 
                    type="button" 
                    onClick={() => setQuantity(prev => product.stockQuantity == null ? prev + 1 : Math.min(product.stockQuantity, prev + 1))}
                    style={{ width: '34px', height: '36px', fontSize: '1.1rem' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart} 
                className="btn-cyber-primary cyber-cut-sm"
                disabled={product.stockQuantity === 0}
              >
                <i className="fa-solid fa-plus"></i> {product.stockQuantity === 0 ? 'OUT OF STOCK' : 'ADD TO ARMORY'}
              </button>

              <button 
                onClick={handleWhatsAppBuy} 
                className="btn-whatsapp-direct cyber-cut-sm"
              >
                <i className="fa-brands fa-whatsapp"></i> BUY VIA WHATSAPP (923348590229)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
