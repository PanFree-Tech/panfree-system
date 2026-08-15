'use client';
import React, { useEffect, useState } from 'react';
import styles from './FloatingCartButton.module.css';

// Ensure global cart singleton exists
function ensureCart() {
  if (typeof window === 'undefined') return null;
  if (!window.__PANFREE_CART) {
    const listeners = new EventTarget();
    const toastListeners = new EventTarget();
    const STORAGE_KEY = 'panfree_cart_v1';
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const items = saved ? JSON.parse(saved) : [];

    const save = () => {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      listeners.dispatchEvent(new CustomEvent('update'));
    };

    window.__PANFREE_CART = {
      items,
      listeners,
      toastListeners,
      isOpen: false,
      subscribe(fn) {
        listeners.addEventListener('update', fn);
      },
      unsubscribe(fn) {
        listeners.removeEventListener('update', fn);
      },
      subscribeOpen(fn) {
        listeners.addEventListener('open', fn);
        listeners.addEventListener('close', fn);
      },
      open() {
        window.__PANFREE_CART.isOpen = true;
        listeners.dispatchEvent(new CustomEvent('open', { detail: true }));
      },
      close() {
        window.__PANFREE_CART.isOpen = false;
        listeners.dispatchEvent(new CustomEvent('close', { detail: false }));
      },
      getItems() {
        return [...items];
      },
      getCount() {
        return items.reduce((s, it) => s + (it.quantity || 1), 0);
      },
      getTotal() {
        return items.reduce((s, it) => s + (it.quantity || 1) * (it.price || 0), 0);
      },
      addItem(product) {
        const idx = items.findIndex((i) => i.id === product.id);
        if (idx >= 0) {
          items[idx].quantity = (items[idx].quantity || 1) + (product.quantity || 1);
        } else {
          items.push({
            ...product,
            quantity: product.quantity || 1,
          });
        }
        save();
      },
      updateQuantity(id, quantity) {
        const idx = items.findIndex((i) => i.id === id);
        if (idx >= 0) {
          items[idx].quantity = quantity;
          if (items[idx].quantity <= 0) items.splice(idx, 1);
          save();
        }
      },
      removeItem(id) {
        const idx = items.findIndex((i) => i.id === id);
        if (idx >= 0) {
          items.splice(idx, 1);
          save();
        }
      },
      clear() {
        items.length = 0;
        save();
      },
      showToast(msg) {
        toastListeners.dispatchEvent(new CustomEvent('toast', { detail: msg }));
      },
      onToast(fn) {
        toastListeners.addEventListener('toast', fn);
      },
      offToast(fn) {
        toastListeners.removeEventListener('toast', fn);
      },
    };
  }
  return window.__PANFREE_CART;
}

export default function FloatingCartButton() {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Marcar que el componente está montado en el cliente
    setIsMounted(true);
    
    const cart = ensureCart();
    if (!cart) return;

    const update = () => {
      setCount(cart.getCount());
      setTotal(cart.getTotal());
    };

    update();
    cart.subscribe(update);

    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    onResize();
    window.addEventListener('resize', onResize);

    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY && currentY > 80 && window.innerWidth < 768) {
        setVisible(true);
      } else {
        setVisible(false);
      }
      lastY = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cart.unsubscribe(update);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const openCart = () => {
    const cart = ensureCart();
    if (!cart) return;
    cart.open();
  };

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₲ ${value}`;
    }
  };

  // ✅ NO renderizar nada hasta que esté montado en el cliente
  if (!isMounted || !isMobile) return null;

  return (
    <div
      id="floating-cart-button"
      className={`${styles.container} ${visible ? styles.show : ''}`}
      aria-hidden={count === 0 ? 'false' : 'false'}
    >
      <button
        className={styles.left}
        aria-label={`Abrir carrito, ${count} productos, total ${formatCurrency(total)}`}
        onClick={openCart}
      >
        <span className={styles.icon} aria-hidden="true">🛒</span>
        <span className={styles.info}>
          <span className={styles.count}>{count} {count === 1 ? 'producto' : 'productos'}</span>
          <span className={styles.total}>{formatCurrency(total)}</span>
        </span>
      </button>
      <button
        className={styles.view}
        onClick={openCart}
        aria-label="Ver carrito"
      >
        Ver carrito
      </button>
    </div>
  );
}