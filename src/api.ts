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

  create: (data: import('./types').CreateProductDTO) =>
    fetcher<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const movementApi = {
  create: (data: import('./types').CreateMovementDTO) =>
    fetcher<import('./types').Movement>('/api/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
