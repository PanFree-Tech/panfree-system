'use client';
import React, { useEffect, useState } from 'react';
import styles from './SlideCart.module.css';

function ensureCart() {
  if (typeof window === 'undefined') return null;
  return window.__PANFREE_CART || null;
}

export default function SlideCart() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Marcar que el componente está montado en el cliente
    setIsMounted(true);
    
    const cart = ensureCart();
    if (!cart) return;

    const update = () => {
      setItems(cart.getItems());
      setTotal(cart.getTotal());
    };

    const onOpen = (e) => {
      setOpen(true);
    };
    const onClose = (e) => {
      setOpen(false);
    };

    cart.listeners.addEventListener('update', update);
    cart.listeners.addEventListener('open', onOpen);
    cart.listeners.addEventListener('close', onClose);

    update();

    return () => {
      cart.listeners.removeEventListener('update', update);
      cart.listeners.removeEventListener('open', onOpen);
      cart.listeners.removeEventListener('close', onClose);
    };
  }, []);

  const close = () => {
    const cart = ensureCart();
    if (!cart) return;
    cart.close();
  };

  const removeItem = (id) => {
    const cart = ensureCart();
    if (!cart) return;
    cart.removeItem(id);
  };

  const changeQuantity = (id, delta) => {
    const cart = ensureCart();
    if (!cart) return;
    const existing = cart.getItems().find(i => i.id === id);
    const next = (existing?.quantity || 1) + delta;
    cart.updateQuantity(id, Math.max(0, next));
  };

  const goToCheckout = () => {
    window.location.href = '/checkout';
  };

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₲ ${value}`;
    }
  };

  // ✅ NO renderizar nada hasta que esté montado en el cliente
  if (!isMounted) return null;

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.show : ''}`} onClick={close} aria-hidden={!open} />
      <aside
        className={`${styles.panel} ${open ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <header className={styles.header}>
          <h3>Tu carrito</h3>
          <button aria-label="Cerrar carrito" onClick={close} className={styles.closeBtn}>✕</button>
        </header>

        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.empty}>Tu carrito está vacío</div>
          ) : (
            <ul className={styles.itemsList}>
              {items.map(item => (
                <li key={item.id} className={styles.item}>
                  <img src={item.image} alt={item.name} className={styles.itemImg} />
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemMeta}>
                      <div className={styles.price}>{formatCurrency(item.price || 0)}</div>
                      <div className={styles.qtyControls}>
                        <button aria-label={`Disminuir cantidad de ${item.name}`} onClick={() => changeQuantity(item.id, -1)}>-</button>
                        <span aria-live="polite" aria-atomic="true">{item.quantity || 1}</span>
                        <button aria-label={`Aumentar cantidad de ${item.name}`} onClick={() => changeQuantity(item.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                  <button aria-label={`Eliminar ${item.name}`} className={styles.removeBtn} onClick={() => removeItem(item.id)}>🗑️</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.summary}>
            <div>Total</div>
            <div className={styles.totalPrice}>{formatCurrency(total)}</div>
          </div>
          <div className={styles.actions}>
            <button className={styles.checkout} onClick={goToCheckout} aria-label="Ir a checkout">Ir a checkout</button>
          </div>
        </footer>
      </aside>
    </>
  );
}