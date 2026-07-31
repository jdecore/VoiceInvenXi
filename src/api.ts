import { API_BASE, findMockProduct } from './constants'
import type { ApiResponse, Product } from './types'

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  clearTimeout(timeout)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de red' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const result: ApiResponse<T> = await response.json()
  return result.data
}

export const productApi = {
  getByBarcode: async (barcode: string): Promise<Product> => {
    try {
      return await fetcher<Product>(`/api/products/${barcode}`)
    } catch {
      const mock = findMockProduct(barcode)
      if (mock) return mock
      throw new Error('Producto no encontrado')
    }
  },

  create: async (data: import('./types').CreateProductDTO): Promise<Product> => {
    try {
      return await fetcher<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch {
      const mockProduct: Product = {
        id: crypto.randomUUID(),
        barcode: data.barcode,
        name: data.name,
        brand: data.brand,
        category: data.category,
        presentation: data.presentation,
        unit: data.unit,
        stock: 0,
        imageUrl: null,
      }
      return mockProduct
    }
  },
}

export const movementApi = {
  create: async (data: import('./types').CreateMovementDTO): Promise<import('./types').Movement> => {
    try {
      return await fetcher<import('./types').Movement>('/api/movements', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch {
      const mockMovement: import('./types').Movement = {
        id: crypto.randomUUID(),
        productId: data.productId,
        quantity: data.quantity,
        type: data.type,
        createdAt: new Date().toISOString(),
      }
      return mockMovement
    }
  },
}
