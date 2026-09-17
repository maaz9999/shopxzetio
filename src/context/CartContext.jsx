import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'shopxzetio_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load cart from storage', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [activeDetailProduct, setActiveDetailProduct] = useState(null);
  const [activeVideoReel, setActiveVideoReel] = useState(null);
  const [currentView, setCurrentView] = useState('store'); // 'store' | 'admin'
  const [toast, setToast] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }, [items]);

  // Toast helper
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const addToCart = (product, qty = 1) => {
    if (product.stockQuantity === 0) {
      showToast(`${product.shortName || product.name} is currently out of stock`);
      return;
    }
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => 
          i.id === product.id ? { ...i, quantity: product.stockQuantity == null ? i.quantity + qty : Math.min(product.stockQuantity, i.quantity + qty) } : i
        );
      } else {
        return [...prev, {
          id: product.id,
          name: product.shortName || product.name,
          fullName: product.name,
          price: product.price,
          image: product.mainImage || (product.images && product.images[0]) || '',
          quantity: product.stockQuantity == null ? qty : Math.min(product.stockQuantity, qty),
          stockQuantity: product.stockQuantity ?? null
        }];
      }
    });

    showToast(`Equipped: ${product.shortName || product.name} added to cart`);
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: item.stockQuantity == null ? newQty : Math.min(item.stockQuantity, newQty) } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setItems(prev => prev.filter(i => i.id !== productId));
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal === 0 ? 0 : (subtotal >= 10000 ? 0 : 250);
  const total = subtotal + shipping;

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openCheckout = () => {
    if (items.length === 0) {
      alert('Your armory is empty. Please select products first.');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const openSuccess = (orderData) => {
    setCompletedOrder(orderData);
    setIsSuccessOpen(true);
  };
  const closeSuccess = () => {
    setIsSuccessOpen(false);
    setCompletedOrder(null);
  };

  const openDetail = (product) => setActiveDetailProduct(product);
  const closeDetail = () => setActiveDetailProduct(null);

  const openReel = (reelKey) => setActiveVideoReel(reelKey);
  const closeReel = () => setActiveVideoReel(null);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItemsCount,
      subtotal,
      shipping,
      total,
      isCartOpen,
      openCart,
      closeCart,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
      isSuccessOpen,
      openSuccess,
      closeSuccess,
      completedOrder,
      activeDetailProduct,
      openDetail,
      closeDetail,
      activeVideoReel,
      openReel,
      closeReel,
      currentView,
      setCurrentView,
      toast,
      showToast
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
