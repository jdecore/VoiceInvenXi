import { API_BASE, findMockProduct } from './constants'
import type { ApiResponse, Product, Movement, SemanticSearchResponse, CreateProductDTO, CreateMovementDTO } from './types'

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

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
    const body = await response.json().catch(() => ({}))
    const msg = body?.detail?.message || (typeof body?.detail === 'string' ? body.detail : null) || body?.message
    throw new Error(msg || `Error HTTP ${response.status}`)
  }

  const result: ApiResponse<T> = await response.json()
  return result.data
}

export const productApi = {
  list: async (): Promise<Product[]> => {
    try {
      return await fetcher<Product[]>('/api/products')
    } catch {
      return []
    }
  },

  getByBarcode: async (barcode: string): Promise<Product> => {
    try {
      return await fetcher<Product>(`/api/products/${barcode}`)
    } catch {
      const mock = findMockProduct(barcode)
      if (mock) return mock
      throw new Error('Producto no encontrado')
    }
  },

  create: async (data: CreateProductDTO): Promise<Product> => {
    return await fetcher<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export const movementApi = {
  list: async (): Promise<Movement[]> => {
    try {
      return await fetcher<Movement[]>('/api/movements')
    } catch {
      return []
    }
  },

  create: async (data: CreateMovementDTO): Promise<Movement> => {
    return await fetcher<Movement>('/api/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export const searchApi = {
  semanticSearch: async (query: string): Promise<SemanticSearchResponse> => {
    return await fetcher<SemanticSearchResponse>('/api/search/semantic', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  },
}
