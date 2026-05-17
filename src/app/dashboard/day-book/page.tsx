'use client'
import { BookOpen } from 'lucide-react'

export default function DayBookPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Day Book</h1>
      </div>
      <div className="ci-card p-12 text-center">
        <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">Day book report - Coming next</p>
      </div>
    </div>
  )
}
