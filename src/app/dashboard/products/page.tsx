'use client'
import { ShoppingBag } from 'lucide-react'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Product Master</h1>
      </div>
      <div className="ci-card p-12 text-center">
        <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">Product master module - Coming next</p>
      </div>
    </div>
  )
}
