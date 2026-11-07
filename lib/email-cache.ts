// Email validation cache system
export type CachedValidationResult = {
  email: string
  result: any
  timestamp: number
  version: string // To handle cache invalidation when validation logic changes
}

const CACHE_KEY = "emailValidationCache"
const CACHE_VERSION = "1.0" // Increment this when validation logic changes significantly
const CACHE_EXPIRY_HOURS = 24 // Cache results for 24 hours

export class EmailValidationCache {
  private cache: Map<string, CachedValidationResult> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (Array.isArray(data)) {
          data.forEach((item: CachedValidationResult) => {
            // Only load items with current version and not expired
            if (item.version === CACHE_VERSION && !this.isExpired(item.timestamp)) {
              this.cache.set(item.email.toLowerCase(), item)
            }
          })
        }
      }
    } catch (error) {
      console.error("Error loading email validation cache:", error)
      // Clear corrupted cache
      localStorage.removeItem(CACHE_KEY)
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.cache.values())
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("Error saving email validation cache:", error)
    }
  }

  private isExpired(timestamp: number): boolean {
    const now = Date.now()
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000 // Convert to milliseconds
    return now - timestamp > expiryTime
  }

  get(email: string): any | null {
    const normalizedEmail = email.toLowerCase()
    const cached = this.cache.get(normalizedEmail)

    if (!cached) {
      return null
    }

    // Check if expired
    if (this.isExpired(cached.timestamp)) {
      this.cache.delete(normalizedEmail)
      this.saveToStorage()
      return null
    }

    return cached.result
  }

  set(email: string, result: any) {
    const normalizedEmail = email.toLowerCase()
    const cachedResult: CachedValidationResult = {
      email: normalizedEmail,
      result,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    }

    this.cache.set(normalizedEmail, cachedResult)
    this.saveToStorage()
  }

  has(email: string): boolean {
    return this.get(email) !== null
  }

  clear() {
    this.cache.clear()
    localStorage.removeItem(CACHE_KEY)
  }

  getStats() {
    const total = this.cache.size
    const expired = Array.from(this.cache.values()).filter((item) => this.isExpired(item.timestamp)).length
    return {
      total,
      valid: total - expired,
      expired,
    }
  }

  // Clean up expired entries
  cleanup() {
    let cleaned = 0
    for (const [email, cached] of this.cache.entries()) {
      if (this.isExpired(cached.timestamp)) {
        this.cache.delete(email)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.saveToStorage()
    }

    return cleaned
  }
}

// Global cache instance
export const emailValidationCache = new EmailValidationCache()
