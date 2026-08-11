export interface Product {
  id: string
  barcode: string
  name: string
  brand: string | null
  category: string | null
  presentation: string | null
  unit: string | null
  stock: number
  imageUrl: string | null
}

export interface CreateProductDTO {
  barcode: string
  name: string
  brand?: string
  category?: string
  presentation?: string
  unit?: string
}

export interface Movement {
  id: string
  productId: string
  quantity: number
  type: 'in' | 'out'
  createdAt: string
}

export interface CreateMovementDTO {
  productId: string
  quantity: number
  type: 'in' | 'out'
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface SemanticSearchResult {
  id: string
  barcode: string
  name: string
  brand: string | null
  category: string | null
  presentation: string | null
  unit: string | null
  stock: number
  score: number
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[]
}
