-- VoiceInvenXi - Inicialización completa para SQL Editor de Supabase
-- Crea las tablas + inserta datos sintéticos
-- Pegar y ejecutar todo junto en Supabase SQL Editor

-- ============================================================
-- 1. CREACIÓN DE TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(255),
  presentation VARCHAR(255),
  unit VARCHAR(50),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON movements(product_id);

-- ============================================================
-- 2. PRODUCTOS (32 productos sintéticos)
-- ============================================================

INSERT INTO products (id, barcode, name, brand, category, presentation, unit, stock, image_url, created_at, updated_at) VALUES

-- Abarrotes
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '7790123456789', 'Aceite de Oliva Extra Virgen', 'La Española', 'Abarrotes', 'Botella 500ml', 'Unidad', 120, NULL, NOW() - INTERVAL '5 months', NOW() - INTERVAL '2 days'),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '7791234567890', 'Arroz Largo Fino', 'Gallo', 'Abarrotes', 'Bolsa 1kg', 'Bolsa', 85, NULL, NOW() - INTERVAL '5 months', NOW() - INTERVAL '1 day'),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '7792345678901', 'Fideos Spaghetti', 'Matarazzo', 'Abarrotes', 'Paquete 500g', 'Paquete', 64, NULL, NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 days'),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', '7793456789012', 'Azúcar Ledesma', 'Ledesma', 'Abarrotes', 'Bolsa 1kg', 'Bolsa', 200, NULL, NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 days'),
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', '7794567890123', 'Harina Cañuelas 000', 'Cañuelas', 'Abarrotes', 'Bolsa 1kg', 'Bolsa', 150, NULL, NOW() - INTERVAL '4 months', NOW() - INTERVAL '1 day'),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102', '7795678901234', 'Sal Fina Celusal', 'Celusal', 'Abarrotes', 'Bolsa 500g', 'Bolsa', 95, NULL, NOW() - INTERVAL '3 months', NOW() - INTERVAL '4 days'),
('07a8b9c0-d1e2-4f3a-4b5c-6d7e8f901213', '7796789012345', 'Mermelada de Damasco', 'Arcor', 'Abarrotes', 'Frasco 450g', 'Unidad', 42, NULL, NOW() - INTERVAL '3 months', NOW() - INTERVAL '6 days'),
('18b9c0d1-e2f3-4a4b-5c6d-7e8f90121324', '7797890123456', 'Mayonesa Fanacoa', 'Fanacoa', 'Abarrotes', 'Botella 500g', 'Unidad', 38, NULL, NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 days'),
('29c0d1e2-f3a4-4b5c-6d7e-8f9012132435', '7798901234567', 'Salsa de Tomate Cañuelas', 'Cañuelas', 'Abarrotes', 'Lata 400g', 'Unidad', 75, NULL, NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 days'),
('30d1e2f3-a4b5-4c6d-7e8f-901213243546', '7799012345678', 'Café Torrado Melitta', 'Melitta', 'Abarrotes', 'Bolsa 250g', 'Unidad', 28, NULL, NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 day'),

-- Lácteos
('41e2f3a4-b5c6-4d7e-8f90-121324354657', '7790123456780', 'Leche Entera La Serenisima', 'La Serenisima', 'Lácteos', 'Caja 1L', 'Caja', 45, NULL, NOW() - INTERVAL '5 months', NOW() - INTERVAL '1 day'),
('52f3a4b5-c6d7-4e8f-9012-132435465768', '7791234567891', 'Yogur Serenísimo Natural', 'La Serenisima', 'Lácteos', 'Pack 4 x 150g', 'Pack', 30, NULL, NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 days'),
('63a4b5c6-d7e8-4f90-1213-243546576879', '7792345678902', 'Queso Cremoso La Paula', 'La Paula', 'Lácteos', 'Unidad 400g', 'Unidad', 18, NULL, NOW() - INTERVAL '2 months', NOW() - INTERVAL '4 days'),
('74b5c6d7-e8f9-4012-1324-354657687980', '7793456789013', 'Manteca Sancor', 'Sancor', 'Lácteos', 'Porción 200g', 'Unidad', 55, NULL, NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 days'),
('85c6d7e8-f901-4213-2435-465768798091', '7794567890124', 'Crema de Lehe La Serenisima', 'La Serenisima', 'Lácteos', 'Tetra Pak 200ml', 'Unidad', 22, NULL, NOW() - INTERVAL '1 month', NOW() - INTERVAL '5 days'),

-- Bebidas
('96d7e8f9-0123-4324-3546-576879809102', '7795678901235', 'Coca-Cola Original', 'Coca-Cola', 'Bebidas', 'Botella 2.25L', 'Unidad', 60, NULL, NOW() - INTERVAL '5 months', NOW() - INTERVAL '1 day'),
('a7e8f901-2343-4435-4657-687980910213', '7796789012346', 'Agua Mineral Villa del Sur', 'Villa del Sur', 'Bebidas', 'Botella 2L', 'Unidad', 80, NULL, NOW() - INTERVAL '4 months', NOW() - INTERVAL '2 days'),
('b8f90123-4344-4546-5768-798091021324', '7797890123457', 'Jugo Cepita Naranja', 'Cepita', 'Bebidas', 'Tetra Pak 1L', 'Unidad', 35, NULL, NOW() - INTERVAL '3 months', NOW() - INTERVAL '6 days'),
('c9012343-4445-4657-6879-809102132435', '7798901234568', 'Cerveza Quilmes Original', 'Quilmes', 'Bebidas', 'Lata 473ml', 'Unidad', 96, NULL, NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 day'),
('d0123434-4546-4768-7980-910213243546', '7799012345679', 'Energía Speed', 'PepsiCo', 'Bebidas', 'Lata 473ml', 'Unidad', 48, NULL, NOW() - INTERVAL '1 month', NOW() - INTERVAL '3 days'),

-- Higiene
('e1234345-4657-4879-8091-021324354657', '7790123456781', 'Jabón en Barra Dove', 'Dove', 'Higiene', 'Unidad 90g', 'Unidad', 40, NULL, NOW() - INTERVAL '5 months', NOW() - INTERVAL '4 days'),
('f2343456-5768-4980-9102-132435465768', '7791234567892', 'Shampoo Pantene Pro-V', 'Pantene', 'Higiene', 'Botella 400ml', 'Unidad', 25, NULL, NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 days'),
('03454567-6879-4091-0213-243546576879', '7792345678903', 'Papel Higiénico Elite', 'Elite', 'Higiene', 'Pack 12 rollos', 'Pack', 33, NULL, NOW() - INTERVAL '4 months', NOW() - INTERVAL '1 day'),
('14565678-7980-4102-1324-354657687980', '7793456789014', 'Pasta Dental Colgate', 'Colgate', 'Higiene', 'Tubo 90g', 'Unidad', 50, NULL, NOW() - INTERVAL '2 months', NOW() - INTERVAL '5 days'),
('25676789-8091-4213-2435-465768798091', '7794567890125', 'Desodorante Rexona', 'Rexona', 'Higiene', 'Barra 50ml', 'Unidad', 28, NULL, NOW() - INTERVAL '1 month', NOW() - INTERVAL '3 days'),

-- Limpieza
('36787890-9102-4324-3546-576879809102', '7795678901236', 'Detergente Magistral', 'Magistral', 'Limpieza', 'Botella 500ml', 'Unidad', 65, NULL, NOW() - INTERVAL '5 months', NOW() - INTERVAL '2 days'),
('47898901-0213-4435-4657-687980910213', '7796789012347', 'Lavandina Ayudín', 'Ayudín', 'Limpieza', 'Botella 1L', 'Unidad', 44, NULL, NOW() - INTERVAL '3 months', NOW() - INTERVAL '4 days'),
('58909012-1324-4546-5768-798091021324', '7797890123458', 'Esponja Ganimedes', 'Ganimedes', 'Limpieza', 'Pack 3 unidades', 'Pack', 70, NULL, NOW() - INTERVAL '2 months', NOW() - INTERVAL '6 days'),
('69010123-2435-4657-6879-809102132435', '7798901234569', 'Jabón en Polvo Ala', 'Ala', 'Limpieza', 'Bolsa 800g', 'Bolsa', 37, NULL, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 day'),

-- Panadería / Congelados
('70121234-3546-4768-7980-910213243546', '7799012345670', 'Pan Lactal Bimbo', 'Bimbo', 'Panadería', 'Paquete 520g', 'Unidad', 15, NULL, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 day'),
('81232345-4657-4879-8091-021324354657', '7790123456782', 'Medallones de Pollo', 'Arcor', 'Congelados', 'Bolsa 450g', 'Bolsa', 20, NULL, NOW() - INTERVAL '2 months', NOW() - INTERVAL '3 days'),
('92343456-5768-4980-9102-132435465768', '7791234567893', 'Papas Fritas McCain', 'McCain', 'Congelados', 'Bolsa 750g', 'Bolsa', 12, NULL, NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 days');

-- ============================================================
-- 3. MOVIMIENTOS DE STOCK
-- ============================================================

INSERT INTO movements (id, product_id, quantity, type, created_at) VALUES

-- Producto 1: Aceite de Oliva
('a0000001-0000-4000-8000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 50, 'in',  NOW() - INTERVAL '5 months' - INTERVAL '2 days'),
('a0000001-0000-4000-8000-000000000002', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 12, 'out', NOW() - INTERVAL '5 months'),
('a0000001-0000-4000-8000-000000000003', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 8,  'out', NOW() - INTERVAL '4 months' - INTERVAL '15 days'),
('a0000001-0000-4000-8000-000000000004', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 40, 'in',  NOW() - INTERVAL '4 months'),
('a0000001-0000-4000-8000-000000000005', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 15, 'out', NOW() - INTERVAL '3 months' - INTERVAL '10 days'),
('a0000001-0000-4000-8000-000000000006', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 25, 'out', NOW() - INTERVAL '3 months'),
('a0000001-0000-4000-8000-000000000007', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 30, 'in',  NOW() - INTERVAL '2 months'),
('a0000001-0000-4000-8000-000000000008', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 10, 'out', NOW() - INTERVAL '1 month'),
('a0000001-0000-4000-8000-000000000009', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 20, 'in',  NOW() - INTERVAL '5 days'),

-- Producto 2: Arroz Gallo
('a0000002-0000-4000-8000-000000000001', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 100, 'in',  NOW() - INTERVAL '5 months' - INTERVAL '5 days'),
('a0000002-0000-4000-8000-000000000002', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 20,  'out', NOW() - INTERVAL '5 months'),
('a0000002-0000-4000-8000-000000000003', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 15,  'out', NOW() - INTERVAL '4 months' - INTERVAL '20 days'),
('a0000002-0000-4000-8000-000000000004', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 30,  'out', NOW() - INTERVAL '4 months'),
('a0000002-0000-4000-8000-000000000005', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 25,  'out', NOW() - INTERVAL '3 months' - INTERVAL '12 days'),
('a0000002-0000-4000-8000-000000000006', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 50,  'in',  NOW() - INTERVAL '3 months'),
('a0000002-0000-4000-8000-000000000007', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 18,  'out', NOW() - INTERVAL '2 months' - INTERVAL '8 days'),
('a0000002-0000-4000-8000-000000000008', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 40,  'in',  NOW() - INTERVAL '2 months'),
('a0000002-0000-4000-8000-000000000009', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 12,  'out', NOW() - INTERVAL '1 month'),
('a0000002-0000-4000-8000-000000000010', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 8,   'out', NOW() - INTERVAL '5 days'),

-- Producto 3: Fideos Matarazzo
('a0000003-0000-4000-8000-000000000001', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 60, 'in',  NOW() - INTERVAL '4 months' - INTERVAL '3 days'),
('a0000003-0000-4000-8000-000000000002', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 10, 'out', NOW() - INTERVAL '4 months'),
('a0000003-0000-4000-8000-000000000003', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 15, 'out', NOW() - INTERVAL '3 months' - INTERVAL '18 days'),
('a0000003-0000-4000-8000-000000000004', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 8,  'out', NOW() - INTERVAL '3 months'),
('a0000003-0000-4000-8000-000000000005', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 20, 'out', NOW() - INTERVAL '2 months' - INTERVAL '5 days'),
('a0000003-0000-4000-8000-000000000006', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 30, 'in',  NOW() - INTERVAL '2 months'),
('a0000003-0000-4000-8000-000000000007', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 7,  'out', NOW() - INTERVAL '1 month' - INTERVAL '10 days'),
('a0000003-0000-4000-8000-000000000008', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 5,  'out', NOW() - INTERVAL '3 days'),

-- Producto 16: Coca-Cola
('a0000016-0000-4000-8000-000000000001', '96d7e8f9-0123-4324-3546-576879809102', 80, 'in',  NOW() - INTERVAL '5 months' - INTERVAL '1 day'),
('a0000016-0000-4000-8000-000000000002', '96d7e8f9-0123-4324-3546-576879809102', 15, 'out', NOW() - INTERVAL '5 months'),
('a0000016-0000-4000-8000-000000000003', '96d7e8f9-0123-4324-3546-576879809102', 20, 'out', NOW() - INTERVAL '4 months' - INTERVAL '10 days'),
('a0000016-0000-4000-8000-000000000004', '96d7e8f9-0123-4324-3546-576879809102', 12, 'out', NOW() - INTERVAL '4 months'),
('a0000016-0000-4000-8000-000000000005', '96d7e8f9-0123-4324-3546-576879809102', 18, 'out', NOW() - INTERVAL '3 months'),
('a0000016-0000-4000-8000-000000000006', '96d7e8f9-0123-4324-3546-576879809102', 50, 'in',  NOW() - INTERVAL '3 months'),
('a0000016-0000-4000-8000-000000000007', '96d7e8f9-0123-4324-3546-576879809102', 10, 'out', NOW() - INTERVAL '2 months'),
('a0000016-0000-4000-8000-000000000008', '96d7e8f9-0123-4324-3546-576879809102', 15, 'out', NOW() - INTERVAL '1 month' - INTERVAL '8 days'),
('a0000016-0000-4000-8000-000000000009', '96d7e8f9-0123-4324-3546-576879809102', 40, 'in',  NOW() - INTERVAL '1 month'),
('a0000016-0000-4000-8000-000000000010', '96d7e8f9-0123-4324-3546-576879809102', 8,  'out', NOW() - INTERVAL '2 days'),

-- Producto 19: Cerveza Quilmes
('a0000019-0000-4000-8000-000000000001', 'c9012343-4445-4657-6879-809102132435', 120, 'in',  NOW() - INTERVAL '2 months' - INTERVAL '5 days'),
('a0000019-0000-4000-8000-000000000002', 'c9012343-4445-4657-6879-809102132435', 12,  'out', NOW() - INTERVAL '2 months'),
('a0000019-0000-4000-8000-000000000003', 'c9012343-4445-4657-6879-809102132435', 18,  'out', NOW() - INTERVAL '1 month' - INTERVAL '20 days'),
('a0000019-0000-4000-8000-000000000004', 'c9012343-4445-4657-6879-809102132435', 10,  'out', NOW() - INTERVAL '1 month'),
('a0000019-0000-4000-8000-000000000005', 'c9012343-4445-4657-6879-809102132435', 24,  'out', NOW() - INTERVAL '15 days'),
('a0000019-0000-4000-8000-000000000006', 'c9012343-4445-4657-6879-809102132435', 6,   'out', NOW() - INTERVAL '1 day'),

-- Producto 23: Papel Higiénico Elite
('a0000023-0000-4000-8000-000000000001', '03454567-6879-4091-0213-243546576879', 50, 'in',  NOW() - INTERVAL '4 months' - INTERVAL '2 days'),
('a0000023-0000-4000-8000-000000000002', '03454567-6879-4091-0213-243546576879', 5,  'out', NOW() - INTERVAL '4 months'),
('a0000023-0000-4000-8000-000000000003', '03454567-6879-4091-0213-243546576879', 4,  'out', NOW() - INTERVAL '3 months'),
('a0000023-0000-4000-8000-000000000004', '03454567-6879-4091-0213-243546576879', 3,  'out', NOW() - INTERVAL '2 months' - INTERVAL '12 days'),
('a0000023-0000-4000-8000-000000000005', '03454567-6879-4091-0213-243546576879', 6,  'out', NOW() - INTERVAL '2 months'),
('a0000023-0000-4000-8000-000000000006', '03454567-6879-4091-0213-243546576879', 25, 'in',  NOW() - INTERVAL '1 month'),
('a0000023-0000-4000-8000-000000000007', '03454567-6879-4091-0213-243546576879', 3,  'out', NOW() - INTERVAL '1 day'),

-- Producto 30: Pan Lactal Bimbo
('a0000030-0000-4000-8000-000000000001', '70121234-3546-4768-7980-910213243546', 25, 'in',  NOW() - INTERVAL '1 month' - INTERVAL '2 days'),
('a0000030-0000-4000-8000-000000000002', '70121234-3546-4768-7980-910213243546', 3,  'out', NOW() - INTERVAL '1 month'),
('a0000030-0000-4000-8000-000000000003', '70121234-3546-4768-7980-910213243546', 4,  'out', NOW() - INTERVAL '15 days'),
('a0000030-0000-4000-8000-000000000004', '70121234-3546-4768-7980-910213243546', 2,  'out', NOW() - INTERVAL '1 day'),

-- Producto 32: Papas Fritas McCain
('a0000032-0000-4000-8000-000000000001', '92343456-5768-4980-9102-132435465768', 25, 'in',  NOW() - INTERVAL '1 month' - INTERVAL '5 days'),
('a0000032-0000-4000-8000-000000000002', '92343456-5768-4980-9102-132435465768', 5,  'out', NOW() - INTERVAL '1 month'),
('a0000032-0000-4000-8000-000000000003', '92343456-5768-4980-9102-132435465768', 4,  'out', NOW() - INTERVAL '12 days'),
('a0000032-0000-4000-8000-000000000004', '92343456-5768-4980-9102-132435465768', 4,  'out', NOW() - INTERVAL '2 days');
