'use client';
import React, { useEffect, useState } from 'react';
import styles from './ToastNotification.module.css';

function ensureCart() {
  if (typeof window === 'undefined') return null;
  return window.__PANFREE_CART || null;
}

export default function ToastNotification() {
  const [toasts, setToasts] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Marcar que el componente está montado en el cliente
    setIsMounted(true);
    
    const cart = ensureCart();
    if (!cart) return;

    const onToast = (ev) => {
      const message = ev.detail;
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((t) => [...t, { id, message }]);
      setTimeout(() => {
        setToasts((t) => t.filter(x => x.id !== id));
      }, 2000);
    };

    cart.onToast(onToast);
    return () => cart.offToast(onToast);
  }, []);

  // ✅ NO renderizar nada hasta que esté montado en el cliente
  if (!isMounted || toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={styles.toast}>
          <div className={styles.icon}>✅</div>
          <div className={styles.message}>{t.message}</div>
        </div>
      ))}
    </div>
  );
}