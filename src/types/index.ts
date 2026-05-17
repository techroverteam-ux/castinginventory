export type UserRole = 'superadmin' | 'admin' | 'manager' | 'viewer'

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  clientId?: string
  phone?: string
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface Client {
  _id: string
  name: string
  logo?: string
  slug: string
  contactEmail: string
  contactPhone?: string
  address?: string
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface InventoryCategory {
  _id: string
  name: string
  description?: string
  clientId: string
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface InventoryItem {
  _id: string
  name: string
  categoryId: string
  clientId: string
  sku: string
  quantity: number
  weight?: number
  unit?: string
  material?: string
  description?: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  createdAt: Date
  updatedAt: Date
}
