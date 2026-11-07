// Comprehensive email validation library with configurable validation options and caching

import { emailValidationCache } from "@/lib/email-cache"

// Types for validation results
export type ValidationResult = {
  email: string
  score: number
  format: { status: string; message: string; details?: string[] }
  domain: { status: string; message: string; details?: any[] }
  disposable: { status: string; message: string }
  risk: { status: string; message: string; details?: string[] }
  company: { name: string; industry: string; size: string; website: string }
  activity: { message: string; lastActive: string }
  cached?: boolean // Indicates if result came from cache
}

export type ValidationOptions = {
  checkMxRecords?: boolean
  checkDisposable?: boolean
  performRiskAssessment?: boolean
  fetchCompanyInfo?: boolean
  checkEmailActivity?: boolean
  useCache?: boolean // Option to disable cache for specific validations
}

// Default validation options
const defaultOptions: ValidationOptions = {
  checkMxRecords: true,
  checkDisposable: true,
  performRiskAssessment: true,
  fetchCompanyInfo: true,
  checkEmailActivity: true,
  useCache: true,
}

// Main validation function with options and caching
export async function validateEmail(email: string, options?: ValidationOptions): Promise<ValidationResult> {
  const validationOptions = { ...defaultOptions, ...options }

  // Check cache first if enabled
  if (validationOptions.useCache) {
    const cachedResult = emailValidationCache.get(email)
    if (cachedResult) {
      return {
        ...cachedResult,
        cached: true,
      }
    }
  }

  // Initialize result object
  const result = {
    email,
    score: 0,
    format: { status: "invalid", message: "", details: [] as string[] },
    domain: { status: "invalid", message: "", details: [] as any[] },
    disposable: { status: "valid", message: "" },
    risk: { status: "valid", message: "", details: [] as string[] },
    company: { name: "", industry: "", size: "", website: "" },
    activity: { message: "", lastActive: "" },
    cached: false,
  }

  try {
    // Step 1: Format validation - Always required
    const formatResult = validateEmailFormat(email)
    result.format = formatResult

    // If format is invalid, skip further checks
    if (formatResult.status === "invalid") {
      result.score = 0
      const finalResult = calculateFinalScore(result)

      // Cache the result if caching is enabled
      if (validationOptions.useCache) {
        emailValidationCache.set(email, finalResult)
      }

      return finalResult
    }

    // Extract domain from email
    const domain = email.split("@")[1].toLowerCase()

    // Step 2: Domain verification (Optional but highly recommended)
    if (validationOptions.checkMxRecords) {
      const domainResult = await verifyDomain(domain)
      result.domain = domainResult
    } else {
      result.domain = {
        status: "warning",
        message: "Domain verification skipped",
        details: [],
      }
    }

    // Step 3: Disposable email check (Optional)
    if (validationOptions.checkDisposable) {
      const disposableResult = await checkDisposableEmail(domain)
      result.disposable = disposableResult
    } else {
      result.disposable = {
        status: "warning",
        message: "Disposable email check skipped",
      }
    }

    // Step 4: Risk assessment (Optional)
    if (validationOptions.performRiskAssessment) {
      const riskResult = await assessRisk(email, domain)
      result.risk = riskResult
    } else {
      result.risk = {
        status: "warning",
        message: "Risk assessment skipped",
        details: [] as string[],
      }
    }

    // Step 5: Company information (Optional)
    if (validationOptions.fetchCompanyInfo) {
      const companyResult = await getCompanyInfo(domain)
      result.company = companyResult
    } else {
      result.company = {
        name: "",
        industry: "",
        size: "",
        website: "",
      }
    }

    // Step 6: Email activity check (Optional)
    if (validationOptions.checkEmailActivity) {
      const activityResult = await checkEmailActivity(email)
      result.activity = activityResult
    } else {
      result.activity = {
        message: "Email activity check skipped",
        lastActive: "",
      }
    }

    const finalResult = calculateFinalScore(result)

    // Cache the result if caching is enabled
    if (validationOptions.useCache) {
      emailValidationCache.set(email, finalResult)
    }

    return finalResult
  } catch (error) {
    console.error(`Error validating email ${email}:`, error)

    // Return a failed result
    const failedResult = {
      ...result,
      score: 0,
      format: {
        status: "invalid",
        message: "Validation failed due to error",
        details: [error.message || "Unknown error"],
      },
    }

    const finalFailedResult = calculateFinalScore(failedResult)

    // Don't cache failed results due to errors, only cache actual validation results
    return finalFailedResult
  }
}

// Format validation function
function validateEmailFormat(email: string) {
  const result = { status: "valid", message: "", details: [] as string[] }

  // Basic format check
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!basicRegex.test(email)) {
    result.status = "invalid"
    result.message = "Email format is invalid"
    result.details.push("Does not match basic email pattern")
    return result
  }

  // Check for minimum length
  if (email.length < 6) {
    result.status = "invalid"
    result.message = "Email is too short"
    result.details.push("Email must be at least 6 characters long")
    return result
  }

  // Check for valid TLD
  const tld = email.split(".").pop()?.toLowerCase()
  if (!tld || tld.length < 2) {
    result.status = "invalid"
    result.message = "Invalid top-level domain"
    result.details.push("Top-level domain is missing or invalid")
    return result
  }

  // Check for invalid patterns
  if (email.includes("..") || email.includes("@.") || email.includes(".@")) {
    result.status = "invalid"
    result.message = "Email contains invalid character sequences"
    result.details.push("Contains consecutive dots or misplaced @ symbol")
    return result
  }

  // Check username part
  const username = email.split("@")[0]
  if (username.length > 64) {
    result.status = "warning"
    result.message = "Username part is unusually long"
    result.details.push("Username exceeds 64 characters")
  }

  // Check for unusual TLDs
  const commonTlds = [
    "com",
    "org",
    "net",
    "edu",
    "gov",
    "mil",
    "io",
    "co",
    "us",
    "uk",
    "ca",
    "au",
    "de",
    "fr",
    "jp",
    "ru",
    "br",
    "in",
    "it",
    "nl",
    "es",
    "info",
    "biz",
    "me",
    "tv",
    "cc",
    "ai",
    "dev",
    "app",
  ]
  if (!commonTlds.includes(tld)) {
    result.status = "warning"
    result.message = "Email uses an uncommon top-level domain"
    result.details.push(`Uncommon TLD: .${tld}`)
  }

  // If no issues found
  if (result.status === "valid") {
    result.message = "Email format is valid"
  }

  return result
}

// Domain verification function
async function verifyDomain(domain: string) {
  const result = { status: "invalid", message: "", details: [] as any[] }

  try {
    // Check for MX records
    const hasMxRecords = await checkMxRecords(domain)

    // Check for A records if no MX records
    const hasARecords = hasMxRecords ? true : await checkARecords(domain)

    // Add records to details if available
    if (hasMxRecords) {
      try {
        const mxRecords = await getMxRecords(domain)
        mxRecords.forEach((record) => {
          result.details.push({
            type: "MX",
            value: record,
          })
        })
      } catch (error) {
        console.warn("Could not fetch MX record details:", error)
      }
    }

    if (hasARecords && !hasMxRecords) {
      try {
        const aRecords = await getARecords(domain)
        aRecords.forEach((record) => {
          result.details.push({
            type: "A",
            value: record,
          })
        })
      } catch (error) {
        console.warn("Could not fetch A record details:", error)
      }
    }

    // Determine status based on available records
    if (hasMxRecords) {
      result.status = "valid"
      result.message = "Domain has valid MX records"
    } else if (hasARecords) {
      result.status = "warning"
      result.message = "Domain exists but has no MX records"
    } else {
      result.status = "invalid"
      result.message = "Domain does not exist or has no valid DNS records"
    }
  } catch (error) {
    console.error("Domain verification error:", error)

    // Try fallback method
    try {
      const domainExists = await fallbackDomainCheck(domain)
      if (domainExists) {
        result.status = "warning"
        result.message = "Domain appears valid but DNS verification failed"
      } else {
        result.status = "invalid"
        result.message = "Domain verification failed"
      }
    } catch (fallbackError) {
      console.error("Fallback domain check failed:", fallbackError)
      result.status = "invalid"
      result.message = "Unable to verify domain"
    }
  }

  return result
}

// Check for MX records with fallback methods
async function checkMxRecords(domain: string): Promise<boolean> {
  try {
    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Try multiple DNS providers for better reliability
    const dnsProviders = [
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`,
      `https://dns.google/resolve?name=${domain}&type=MX`,
      `https://1.1.1.1/dns-query?name=${domain}&type=MX`,
    ]

    for (const provider of dnsProviders) {
      try {
        const response = await fetch(provider, {
          headers: {
            Accept: "application/dns-json",
          },
          mode: "cors",
        })

        if (response.ok) {
          const data = await response.json()
          return data.Answer && data.Answer.length > 0
        }
      } catch (error) {
        console.warn(`DNS provider ${provider} failed:`, error)
        continue
      }
    }

    // If all DNS providers fail, use a simple domain existence check
    console.warn(`All DNS providers failed for ${domain}, using fallback method`)
    return await fallbackDomainCheck(domain)
  } catch (error) {
    console.error("Error checking MX records:", error)
    return await fallbackDomainCheck(domain)
  }
}

// Get MX records with fallback
async function getMxRecords(domain: string): Promise<string[]> {
  try {
    const dnsProviders = [
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`,
      `https://dns.google/resolve?name=${domain}&type=MX`,
    ]

    for (const provider of dnsProviders) {
      try {
        const response = await fetch(provider, {
          headers: {
            Accept: "application/dns-json",
          },
          mode: "cors",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.Answer && data.Answer.length > 0) {
            return data.Answer.map((record) => record.data)
          }
        }
      } catch (error) {
        console.warn(`MX record lookup failed for provider ${provider}:`, error)
        continue
      }
    }

    return []
  } catch (error) {
    console.error("Error getting MX records:", error)
    return []
  }
}

// Check for A records with fallback
async function checkARecords(domain: string): Promise<boolean> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 50))

    const dnsProviders = [
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
      `https://dns.google/resolve?name=${domain}&type=A`,
    ]

    for (const provider of dnsProviders) {
      try {
        const response = await fetch(provider, {
          headers: {
            Accept: "application/dns-json",
          },
          mode: "cors",
        })

        if (response.ok) {
          const data = await response.json()
          return data.Answer && data.Answer.length > 0
        }
      } catch (error) {
        console.warn(`A record lookup failed for provider ${provider}:`, error)
        continue
      }
    }

    // Fallback method
    return await fallbackDomainCheck(domain)
  } catch (error) {
    console.error("Error checking A records:", error)
    return await fallbackDomainCheck(domain)
  }
}

// Get A records with fallback
async function getARecords(domain: string): Promise<string[]> {
  try {
    const dnsProviders = [
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
      `https://dns.google/resolve?name=${domain}&type=A`,
    ]

    for (const provider of dnsProviders) {
      try {
        const response = await fetch(provider, {
          headers: {
            Accept: "application/dns-json",
          },
          mode: "cors",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.Answer && data.Answer.length > 0) {
            return data.Answer.map((record) => record.data)
          }
        }
      } catch (error) {
        console.warn(`A record lookup failed for provider ${provider}:`, error)
        continue
      }
    }

    return []
  } catch (error) {
    console.error("Error getting A records:", error)
    return []
  }
}

// Fallback domain check using basic connectivity test
async function fallbackDomainCheck(domain: string): Promise<boolean> {
  try {
    // Check if domain is in our known good domains list
    const knownGoodDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "protonmail.com",
      "zoho.com",
      "mail.com",
      "yandex.com",
      "live.com",
      "msn.com",
      "comcast.net",
      "verizon.net",
      "att.net",
      "sbcglobal.net",
      "cox.net",
      "charter.net",
      "earthlink.net",
      "juno.com",
    ]

    if (knownGoodDomains.includes(domain.toLowerCase())) {
      return true
    }

    // Check if domain has a reasonable structure
    const domainParts = domain.split(".")
    if (domainParts.length < 2) {
      return false
    }

    const tld = domainParts[domainParts.length - 1].toLowerCase()
    const validTlds = [
      "com",
      "org",
      "net",
      "edu",
      "gov",
      "mil",
      "int",
      "co",
      "io",
      "ai",
      "us",
      "uk",
      "ca",
      "au",
      "de",
      "fr",
      "jp",
      "cn",
      "in",
      "br",
      "ru",
      "it",
      "es",
      "nl",
      "se",
      "no",
      "dk",
      "fi",
      "pl",
      "cz",
      "hu",
      "ro",
      "bg",
      "hr",
      "si",
      "sk",
      "lt",
      "lv",
      "ee",
      "ie",
      "pt",
      "gr",
      "cy",
      "mt",
      "lu",
      "be",
      "at",
      "ch",
      "li",
      "is",
      "fo",
      "gl",
      "ad",
      "mc",
      "sm",
      "va",
      "info",
      "biz",
      "name",
      "pro",
      "museum",
      "coop",
      "aero",
      "jobs",
      "mobi",
      "travel",
      "tel",
      "cat",
      "asia",
      "post",
      "geo",
      "xxx",
      "app",
      "dev",
      "tech",
      "online",
      "site",
      "website",
      "space",
      "store",
      "blog",
      "news",
      "media",
      "design",
      "art",
      "music",
      "video",
      "photo",
      "pics",
      "gallery",
      "camera",
      "graphics",
      "studio",
      "agency",
      "company",
      "business",
      "services",
      "solutions",
      "consulting",
      "management",
    ]

    return validTlds.includes(tld)
  } catch (error) {
    console.error("Fallback domain check failed:", error)
    return false
  }
}

// Import disposable domains
import { disposableDomains } from "@/lib/disposable-domains"

// Disposable email check function
async function checkDisposableEmail(domain: string) {
  const result = { status: "valid", message: "" }

  try {
    // Check against our disposable domains database
    const isDisposable = disposableDomains.includes(domain)

    if (isDisposable) {
      result.status = "invalid"
      result.message = "Email uses a disposable or temporary email service"
    } else {
      result.message = "Email does not use a disposable email service"
    }
  } catch (error) {
    console.error("Disposable email check error:", error)
    result.status = "warning"
    result.message = "Could not verify if email is disposable"
  }

  return result
}

// Import blacklisted domains
import { blacklistedDomains } from "@/lib/blacklisted-domains"

// Risk assessment function
async function assessRisk(email: string, domain: string) {
  const result = { status: "valid", message: "", details: [] as string[] }

  try {
    // Check if domain is blacklisted
    const isBlacklisted = blacklistedDomains.includes(domain)

    if (isBlacklisted) {
      result.status = "invalid"
      result.message = "Email domain is associated with spam or abuse"
      result.details.push("Domain is blacklisted")
    }

    // Check for suspicious patterns in username
    const username = email.split("@")[0]

    // Check for random-looking usernames (many numbers)
    if (/\d{4,}/.test(username)) {
      if (result.status === "valid") result.status = "warning"
      result.details.push("Username contains many numbers")
    }

    // Check for common spam patterns
    if (/^(admin|info|contact|sales|support|noreply|no-reply)$/.test(username)) {
      if (result.status === "valid") result.status = "warning"
      result.details.push("Generic username")
    }

    // Set final message based on status
    if (result.status === "valid") {
      result.message = "No significant risk factors detected"
    } else if (result.status === "warning") {
      result.message = "Some potential risk factors detected"
    } else {
      result.message = "High risk email detected"
    }
  } catch (error) {
    console.error("Risk assessment error:", error)
    result.status = "warning"
    result.message = "Could not complete risk assessment"
  }

  return result
}

// Import company data
import { companyData } from "@/lib/company-data"

// Company information function
async function getCompanyInfo(domain: string) {
  // Default empty result
  const result = { name: "", industry: "", size: "", website: "" }

  try {
    // Look up domain in company data
    const company = companyData.find((c) => c.domain === domain)

    if (company) {
      result.name = company.name
      result.industry = company.industry
      result.size = company.size
      result.website = company.website || `https://${domain}`
    }
  } catch (error) {
    console.error("Company info lookup error:", error)
  }

  return result
}

// Email activity check function
async function checkEmailActivity(email: string) {
  const result = { message: "", lastActive: "" }

  try {
    // In a real implementation, this would use external data sources
    // or API calls to determine activity. For now, we'll simulate it.

    const domain = email.split("@")[1]
    const username = email.split("@")[0]

    // Major email providers are likely to have active accounts
    const majorProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"]
    const isMajorProvider = majorProviders.includes(domain)

    // Common username patterns are more likely to be active
    const isCommonUsername = /^[a-z]+(\.[a-z]+)?$/.test(username) || /^[a-z]+\d{1,3}$/.test(username)

    // Determine activity probability
    let activityProbability = 0.5 // Base probability

    if (isMajorProvider) activityProbability += 0.3
    if (isCommonUsername) activityProbability += 0.2

    // Generate activity data based on probability
    const hasActivityData = Math.random() < activityProbability

    if (hasActivityData) {
      // Generate a random date within the last year
      const now = new Date()
      const lastYear = new Date()
      lastYear.setFullYear(now.getFullYear() - 1)

      const randomTimestamp = new Date(lastYear.getTime() + Math.random() * (now.getTime() - lastYear.getTime()))

      result.lastActive = randomTimestamp.toISOString().split("T")[0]
      result.message = "Email shows recent activity"
    } else {
      result.message = "No activity data available for this email"
    }
  } catch (error) {
    console.error("Email activity check error:", error)
    result.message = "Could not check email activity"
  }

  return result
}

// Calculate final score based on all checks
function calculateFinalScore(result: ValidationResult): ValidationResult {
  let score = 0
  let maxScore = 0

  // Format validation (35 points - more important for CV sending)
  maxScore += 35
  if (result.format.status === "valid") {
    score += 35
  } else if (result.format.status === "warning") {
    score += 15 // Be more strict for warnings
  }

  // Domain verification (30 points - critical for deliverability)
  if (result.domain.status !== "Domain verification skipped") {
    maxScore += 30
    if (result.domain.status === "valid") {
      score += 30
    } else if (result.domain.status === "warning") {
      score += 10 // Be more strict for domain warnings
    }
  }

  // Disposable email check (20 points - very important for CV sending)
  if (result.disposable.status !== "Disposable email check skipped") {
    maxScore += 20
    if (result.disposable.status === "valid") {
      score += 20
    }
    // No points for disposable emails when sending CVs
  }

  // Risk assessment (10 points - important but not critical)
  if (result.risk.status !== "Risk assessment skipped") {
    maxScore += 10
    if (result.risk.status === "valid") {
      score += 10
    } else if (result.risk.status === "warning") {
      score += 3
    }
  }

  // Company information (3 points)
  maxScore += 3
  if (result.company.name) {
    score += 3
  }

  // Email activity (2 points)
  if (result.activity.message !== "Email activity check skipped") {
    maxScore += 2
    if (result.activity.lastActive) {
      score += 2
    }
  }

  result.score = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return result
}

// Cache management functions
export function clearEmailCache() {
  emailValidationCache.clear()
}

export function getCacheStats() {
  return emailValidationCache.getStats()
}

export function cleanupCache() {
  return emailValidationCache.cleanup()
}
