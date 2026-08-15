'use client';
import React, { useEffect, useState } from 'react';
import styles from './FloatingCartButton.module.css';
import { useCart } from '../context/CartContext';

export default function FloatingCartButton() {
  const { cantidadItems, total, setVisible } = useCart();
  const [visibleOnScroll, setVisibleOnScroll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);

    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY && currentY > 80 && window.innerWidth < 768) {
        setVisibleOnScroll(true);
      } else {
        setVisibleOnScroll(false);
      }
      lastY = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const openCart = () => setVisible(true);

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₲ ${value}`;
    }
  };

  if (!isMounted || !isMobile) return null;

  return (
    <div
      id="floating-cart-button"
      className={`${styles.container} ${visibleOnScroll ? styles.show : ''}`}
      aria-hidden={cantidadItems === 0 ? 'false' : 'false'}
    >
      <button
        className={styles.left}
        aria-label={`Abrir carrito, ${cantidadItems} productos, total ${formatCurrency(total)}`}
        onClick={openCart}
      >
        <span className={styles.icon} aria-hidden="true">🛒</span>
        <span className={styles.info}>
          <span className={styles.count}>{cantidadItems} {cantidadItems === 1 ? 'producto' : 'productos'}</span>
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