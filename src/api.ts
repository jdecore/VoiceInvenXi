import { API_BASE } from './constants'
import type { ApiResponse, Product, Movement, SemanticSearchResponse, CreateProductDTO, CreateMovementDTO, MovementIntent, ProductFields } from './types'

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

  try {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      const msg = body?.detail?.message || (typeof body?.detail === 'string' ? body.detail : null) || body?.message
      throw new Error(msg || `Error HTTP ${response.status}`)
    }

    const result: ApiResponse<T> = await response.json()
    return result.data
  } finally {
    clearTimeout(timeout)
  }
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
    const normalizedBarcode = barcode.trim()
    if (!normalizedBarcode) {
      throw new Error('Código de barras inválido')
    }
    return await fetcher<Product>(`/api/products/${encodeURIComponent(normalizedBarcode)}`)
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

export interface SeedEmbeddingsResponse {
  updated: number
  total: number
}

export const searchApi = {
  semanticSearch: async (query: string): Promise<SemanticSearchResponse> => {
    return await fetcher<SemanticSearchResponse>('/api/search/semantic', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  },

  seedEmbeddings: async (): Promise<SeedEmbeddingsResponse> => {
    const url = `${API_BASE}/api/search/seed-embeddings`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000)
    try {
      const response = await fetch(url, { method: 'POST', signal: controller.signal })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const msg = body?.detail?.message || body?.message
        throw new Error(msg || `Error HTTP ${response.status}`)
      }
      return (await response.json()) as SeedEmbeddingsResponse
    } finally {
      clearTimeout(timeout)
    }
  },
}

export const agentApi = {
  parseMovement: async (text: string): Promise<MovementIntent | null> => {
    return await fetcher<MovementIntent | null>('/api/agent/parse-movement', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  },

  parseProduct: async (text: string): Promise<ProductFields | null> => {
    return await fetcher<ProductFields | null>('/api/agent/parse-product', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  },
}
