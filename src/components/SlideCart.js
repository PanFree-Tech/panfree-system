'use client';
import React, { useEffect, useState } from 'react';
import styles from './SlideCart.module.css';
import { useCart } from '../context/CartContext';

export default function SlideCart() {
  const {
    carrito,
    visible,
    setVisible,
    actualizarCantidad,
    eliminarDelCarrito,
    total,
  } = useCart();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const close = () => setVisible(false);

  const removeItem = (id) => eliminarDelCarrito(id);

  const changeQuantity = (id, delta) => {
    const existing = carrito.find(i => i.id === id);
    const next = (existing?.cantidad || existing?.quantity || 1) + delta;
    actualizarCantidad(id, Math.max(0, next));
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

  if (!isMounted) return null;

  return (
    <>
      <div className={`${styles.backdrop} ${visible ? styles.show : ''}`} onClick={close} aria-hidden={!visible} />
      <aside
        className={`${styles.panel} ${visible ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <header className={styles.header}>
          <h3>Tu carrito</h3>
          <button aria-label="Cerrar carrito" onClick={close} className={styles.closeBtn}>✕</button>
        </header>

        <div className={styles.content}>
          {carrito.length === 0 ? (
            <div className={styles.empty}>Tu carrito está vacío</div>
          ) : (
            <ul className={styles.itemsList}>
              {carrito.map(item => (
                <li key={item.id} className={styles.item}>
                  <img src={item.image || item.imagen_url} alt={item.name || item.nombre} className={styles.itemImg} />
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name || item.nombre}</div>
                    <div className={styles.itemMeta}>
                      <div className={styles.price}>{formatCurrency(item.price || item.precio_venta || 0)}</div>
                      <div className={styles.qtyControls}>
                        <button aria-label={`Disminuir cantidad de ${item.name || item.nombre}`} onClick={() => changeQuantity(item.id, -1)}>-</button>
                        <span aria-live="polite" aria-atomic="true">{item.cantidad || item.quantity || 1}</span>
                        <button aria-label={`Aumentar cantidad de ${item.name || item.nombre}`} onClick={() => changeQuantity(item.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                  <button aria-label={`Eliminar ${item.name || item.nombre}`} className={styles.removeBtn} onClick={() => removeItem(item.id)}>🗑️</button>
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