import type { Product } from './types'

export const API_BASE = import.meta.env.VITE_API_URL || 'https://voiceinvenoxi-api.onrender.com'

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    barcode: '7790123456789',
    name: 'Aceite de Oliva Extra Virgen',
    brand: 'La Española',
    category: 'Abarrotes',
    presentation: 'Botella 500ml',
    unit: 'Unidad',
    stock: 120,
    imageUrl: null,
  },
  {
    id: '2',
    barcode: '7791234567890',
    name: 'Arroz Largo Fino',
    brand: 'Gallo',
    category: 'Abarrotes',
    presentation: 'Bolsa 1kg',
    unit: 'Bolsa',
    stock: 8,
    imageUrl: null,
  },
  {
    id: '3',
    barcode: '7792345678901',
    name: 'Leche Entera',
    brand: 'La Serenisima',
    category: 'Lácteos',
    presentation: 'Caja 1L',
    unit: 'Caja',
    stock: 45,
    imageUrl: null,
  },
  {
    id: '4',
    barcode: '7793456789012',
    name: 'Jabón en Barra',
    brand: 'Dove',
    category: 'Higiene',
    presentation: 'Unidad 90g',
    unit: 'Unidad',
    stock: 0,
    imageUrl: null,
  },
  {
    id: '5',
    barcode: '7794567890123',
    name: 'Papel Higiénico',
    brand: 'Elite',
    category: 'Higiene',
    presentation: 'Pack 12 rollos',
    unit: 'Pack',
    stock: 200,
    imageUrl: null,
  },
]

export function findMockProduct(barcode: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.barcode === barcode)
}
