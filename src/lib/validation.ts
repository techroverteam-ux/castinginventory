/**
 * Validates phone number - accepts:
 * - Indian: +91 9876543210, 09876543210, 9876543210
 * - International: +1 234 567 8901, +44 7911 123456
 * - Must be 10-15 digits (after removing formatting)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || !phone.trim()) return true // optional field
  const digits = phone.replace(/[\s\-\(\)\+]/g, '')
  if (digits.length < 10 || digits.length > 15) return false
  if (!/^\d+$/.test(digits)) return false
  return true
}

/**
 * Returns cleaned phone or error message
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) return { valid: true }
  const cleaned = phone.trim()
  // Must start with + or digit
  if (!/^[\+\d]/.test(cleaned)) return { valid: false, error: 'Phone must start with + or digit' }
  const digits = cleaned.replace(/[\s\-\(\)\+]/g, '')
  if (!/^\d+$/.test(digits)) return { valid: false, error: 'Phone contains invalid characters' }
  if (digits.length < 10) return { valid: false, error: 'Phone must be at least 10 digits' }
  if (digits.length > 15) return { valid: false, error: 'Phone must not exceed 15 digits' }
  return { valid: true }
}
