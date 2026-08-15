-- Migration: Añadir columnas role y avatar a clientes si no existen
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS role text DEFAULT 'cliente';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS avatar text;
