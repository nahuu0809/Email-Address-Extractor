"use client"

import { DropdownMenuSub } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Copy,
  FileText,
  Send,
  Check,
  X,
  AlertTriangle,
  GitCompareArrowsIcon as CompareArrows,
  Download,
  Upload,
  Save,
  Share2,
  Settings,
  RefreshCw,
  Filter,
  ChevronsUpDown,
  Database,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { validateEmail, getCacheStats, clearEmailCache, cleanupCache } from "@/lib/email-validator"
import EmailDetailsModal from "@/components/email-details-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import ValidationSettingsComponent from "@/components/validation-settings"

type ValidationResult = {
  email: string
  score: number
  format: { status: string; message: string; details?: string[] }
  domain: { status: string; message: string; details?: any[] }
  disposable: { status: string; message: string }
  risk: { status: string; message: string; details?: string[] }
  company: { name: string; industry: string; size: string; website: string }
  activity: { message: string; lastActive: string }
  cached?: boolean
}

type EmailStatus = {
  email: string
  validationResult: ValidationResult | null
  isValid: boolean
}

type SavedList = {
  id: string
  name: string
  emails: string[]
  createdAt: string
}

export type ValidationSettingsType = {
  scoreThreshold: number
  checkMxRecords: boolean
  checkDisposable: boolean
  performRiskAssessment: boolean
  fetchCompanyInfo: boolean
  checkEmailActivity: boolean
  validationTimeout: number
}

export default function EmailExtractorUnified() {
  // State for email input and extraction
  const [inputText, setInputText] = useState("")
  const [inputText2, setInputText2] = useState("")
  const [extractedEmails, setExtractedEmails] = useState<EmailStatus[]>([])
  const [comparisonResult, setComparisonResult] = useState<{
    duplicates: string[]
    uniqueToList1: string[]
    uniqueToList2: string[]
  } | null>(null)

  // UI states
  const [copied, setCopied] = useState(false)
  const [showOnlyValid, setShowOnlyValid] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("validate")
  const [validationProgress, setValidationProgress] = useState(0)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [listSortOrder, setListSortOrder] = useState<"score" | "name" | "status">("score")
  const [showAddToExistingListDialog, setShowAddToExistingListDialog] = useState(false)
  const [selectedListForAdd, setSelectedListForAdd] = useState("")
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [filterScoreMin, setFilterScoreMin] = useState(0)
  const [filterDomainStatus, setFilterDomainStatus] = useState<string | null>(null)
  const [filterDisposableStatus, setFilterDisposableStatus] = useState<string | null>(null)
  const [cacheStats, setCacheStats] = useState({ total: 0, valid: 0, expired: 0 })

  // Saved data
  const [savedLists, setSavedLists] = useState<SavedList[]>([])
  const [newListName, setNewListName] = useState("")
  const [validationHistory, setValidationHistory] = useState<
    {
      date: string
      emailCount: number
      validCount: number
      invalidCount: number
      cachedCount?: number
    }[]
  >([])

  // Validation settings
  const [validationSettings, setValidationSettings] = useState<ValidationSettingsType>({
    scoreThreshold: 80, // Higher threshold for CV sending
    checkMxRecords: true,
    checkDisposable: true,
    performRiskAssessment: true,
    fetchCompanyInfo: false, // Disable to speed up validation
    checkEmailActivity: false, // Disable to speed up validation
    validationTimeout: 300, // Increased to 5 minutes for larger lists
  })

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const { toast } = useToast()

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("emailExtractorData")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setInputText(parsedData.inputText || "")
        setInputText2(parsedData.inputText2 || "")
        setExtractedEmails(parsedData.extractedEmails || [])
        setComparisonResult(parsedData.comparisonResult || null)
      } catch (error) {
        console.error("Error parsing saved data:", error)
      }
    }

    const savedListsData = localStorage.getItem("emailExtractorSavedLists")
    if (savedListsData) {
      try {
        setSavedLists(JSON.parse(savedListsData))
      } catch (error) {
        console.error("Error parsing saved lists:", error)
      }
    }

    const savedSettingsData = localStorage.getItem("emailValidatorSettings")
    if (savedSettingsData) {
      try {
        setValidationSettings(JSON.parse(savedSettingsData))
      } catch (error) {
        console.error("Error parsing validation settings:", error)
      }
    }

    const historyData = localStorage.getItem("emailValidatorHistory")
    if (historyData) {
      try {
        setValidationHistory(JSON.parse(historyData))
      } catch (error) {
        console.error("Error parsing validation history:", error)
      }
    }

    // Update cache stats
    updateCacheStats()

    // Parse URL for shared emails
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const sharedEmails = urlParams.get("emails")
      if (sharedEmails) {
        setInputText(decodeURIComponent(sharedEmails))
        toast({
          title: "Shared List Loaded",
          description: "Email list from shared URL has been loaded.",
        })
        // Clear the URL parameter without refreshing the page
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem(
      "emailExtractorData",
      JSON.stringify({
        inputText,
        inputText2,
        extractedEmails,
        comparisonResult,
      }),
    )
  }, [inputText, inputText2, extractedEmails, comparisonResult])

  useEffect(() => {
    localStorage.setItem("emailExtractorSavedLists", JSON.stringify(savedLists))
  }, [savedLists])

  useEffect(() => {
    localStorage.setItem("emailValidatorSettings", JSON.stringify(validationSettings))
  }, [validationSettings])

  useEffect(() => {
    localStorage.setItem("emailValidatorHistory", JSON.stringify(validationHistory))
  }, [validationHistory])

  // Update cache stats
  const updateCacheStats = () => {
    setCacheStats(getCacheStats())
  }

  // Main validation function with caching
  const extractAndValidateEmails = async () => {
    setIsValidating(true)
    setValidationProgress(0)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails = inputText.match(emailRegex) || []
    const uniqueEmails = [...new Set(emails)]

    if (uniqueEmails.length === 0) {
      toast({
        title: "No Emails Found",
        description: "No valid email addresses were found in the text.",
        variant: "destructive",
      })
      setIsValidating(false)
      return
    }

    // Process emails in smaller batches for better performance
    const BATCH_SIZE = 10
    const validatedEmails: EmailStatus[] = []
    const startTime = Date.now()
    const timeout = validationSettings.validationTimeout * 1000
    let timeoutReached = false
    let dnsErrors = 0
    let cachedCount = 0

    for (let batchStart = 0; batchStart < uniqueEmails.length; batchStart += BATCH_SIZE) {
      // Check if operation has been running too long
      if (timeout > 0 && Date.now() - startTime > timeout) {
        timeoutReached = true
        toast({
          title: "Validation Timeout",
          description: `Validation stopped after ${validationSettings.validationTimeout} seconds. ${batchStart} of ${uniqueEmails.length} emails processed. You can continue with the remaining emails.`,
          variant: "destructive",
        })
        break
      }

      const batchEnd = Math.min(batchStart + BATCH_SIZE, uniqueEmails.length)
      const batch = uniqueEmails.slice(batchStart, batchEnd)

      // Process batch in parallel with individual timeouts
      const batchPromises = batch.map(async (email, index) => {
        try {
          const emailValidationPromise = validateEmail(email, {
            checkMxRecords: validationSettings.checkMxRecords,
            checkDisposable: validationSettings.checkDisposable,
            performRiskAssessment: validationSettings.performRiskAssessment,
            fetchCompanyInfo: validationSettings.fetchCompanyInfo,
            checkEmailActivity: validationSettings.checkEmailActivity,
            useCache: true, // Enable caching
          })

          // Set individual email timeout to 5 seconds
          const emailTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email validation timeout")), 5000),
          )

          const validationResult = (await Promise.race([emailValidationPromise, emailTimeout])) as ValidationResult

          // Track cached results
          if (validationResult.cached) {
            cachedCount++
          }

          return {
            email,
            validationResult,
            isValid: validationResult.score >= validationSettings.scoreThreshold,
          }
        } catch (error) {
          console.error(`Error validating ${email}:`, error)

          // Track DNS-related errors
          if (error.message && error.message.includes("fetch")) {
            dnsErrors++
          }

          return {
            email,
            validationResult: null,
            isValid: false,
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      validatedEmails.push(...batchResults)

      // Update progress
      setValidationProgress(Math.round(((batchStart + batch.length) / uniqueEmails.length) * 100))

      // Small delay between batches to avoid overwhelming DNS servers
      if (batchEnd < uniqueEmails.length) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    setExtractedEmails(validatedEmails)
    setIsValidating(false)

    // Update validation history
    const validCount = validatedEmails.filter((item) => item.isValid).length
    const historyEntry = {
      date: new Date().toISOString(),
      emailCount: validatedEmails.length,
      validCount,
      invalidCount: validatedEmails.length - validCount,
      cachedCount,
    }

    setValidationHistory((prev) => [historyEntry, ...prev].slice(0, 10))

    const successRate = Math.round((validCount / validatedEmails.length) * 100)

    // Update cache stats
    updateCacheStats()

    // Show appropriate toast message based on results
    let toastMessage = `Validated ${validatedEmails.length} email addresses. ${validCount} valid (${successRate}% success rate), ${validatedEmails.length - validCount} invalid.`

    if (cachedCount > 0) {
      toastMessage += ` ${cachedCount} results loaded from cache.`
    }

    if (dnsErrors > 0) {
      toastMessage += ` Note: ${dnsErrors} emails had DNS lookup issues and may need manual verification.`
    }

    toast({
      title: timeoutReached ? "Partial Validation Complete" : "Validation Complete",
      description: toastMessage,
      variant: dnsErrors > validatedEmails.length / 2 ? "destructive" : "default",
    })
  }

  // Compare email lists functionality
  const compareEmailLists = async () => {
    setIsComparing(true)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails1 = inputText.match(emailRegex) || []
    const emails2 = inputText2.match(emailRegex) || []

    if (emails1.length === 0 || emails2.length === 0) {
      toast({
        title: "Empty List",
        description: "One or both of the email lists are empty.",
        variant: "destructive",
      })
      setIsComparing(false)
      return
    }

    const set1 = new Set(emails1)
    const set2 = new Set(emails2)

    const duplicates = [...set1].filter((email) => set2.has(email))
    const uniqueToList1 = [...set1].filter((email) => !set2.has(email))
    const uniqueToList2 = [...set2].filter((email) => !set1.has(email))

    setComparisonResult({
      duplicates,
      uniqueToList1,
      uniqueToList2,
    })
    setIsComparing(false)

    toast({
      title: "Comparison Complete",
      description: `Found ${duplicates.length} duplicates, ${uniqueToList1.length} unique to list 1, and ${uniqueToList2.length} unique to list 2.`,
    })
  }

  // Cache management functions
  const handleClearCache = () => {
    clearEmailCache()
    updateCacheStats()
    toast({
      title: "Cache Cleared",
      description: "All cached validation results have been cleared.",
    })
  }

  const handleCleanupCache = () => {
    const cleaned = cleanupCache()
    updateCacheStats()
    toast({
      title: "Cache Cleaned",
      description: `Removed ${cleaned} expired cache entries.`,
    })
  }

  // Email client integration
  const openEmailClient = (emails: EmailStatus[]) => {
    if (emails.length === 0) {
      toast({
        title: "No Emails",
        description: "No email addresses to send to.",
        variant: "destructive",
      })
      return
    }

    const validEmails = emails.filter((item) => item.isValid).map((item) => item.email)

    if (validEmails.length === 0) {
      toast({
        title: "No Valid Emails",
        description: "No valid email addresses found to send to.",
        variant: "destructive",
      })
      return
    }

    // Try to detect email client preference from localStorage
    const emailClientPreference = localStorage.getItem("emailClientPreference") || "default"

    switch (emailClientPreference) {
      case "gmail":
        window.open(`https://mail.google.com/mail/?view=cm&bcc=${validEmails.join(",")}`)
        break
      case "outlook":
        const mailtoLink = `mailto:?bcc=${validEmails.join(",")}`
        window.open(mailtoLink)
        break
      case "yahoo":
        window.open(`https://compose.mail.yahoo.com/?bcc=${validEmails.join(",")}`)
        break
      default:
        const defaultMailtoLink = `mailto:?bcc=${validEmails.join(",")}`
        window.open(defaultMailtoLink)
    }

    toast({
      title: "Opening Email Client",
      description: `Opening email with ${validEmails.length} recipients in BCC.`,
    })
  }

  // Clipboard functionality
  const copyToClipboard = (emails: EmailStatus[]) => {
    if (emails.length === 0) {
      toast({
        title: "No Emails",
        description: "No email addresses to copy.",
        variant: "destructive",
      })
      return
    }

    const emailText = emails.map((item) => item.email).join("; ")
    navigator.clipboard.writeText(emailText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Copied to Clipboard",
      description: `${emails.length} email addresses copied to clipboard.`,
    })
  }

  // Export functionality
  const exportToCSV = (data: string[] | EmailStatus[], filename: string, includeValidationDetails = false) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export.",
        variant: "destructive",
      })
      return
    }

    let csvContent: string

    if (typeof data[0] === "string") {
      // Simple string array export
      csvContent = "data:text/csv;charset=utf-8," + (data as string[]).join("\n")
    } else {
      // EmailStatus array with validation details
      const emailData = data as EmailStatus[]

      if (includeValidationDetails) {
        // Include detailed validation results
        const headers = [
          "Email",
          "Valid",
          "Score",
          "Format Status",
          "Domain Status",
          "Disposable Status",
          "Risk Status",
          "Company Name",
          "Industry",
          "Last Activity",
          "Cached",
        ]

        const rows = [
          headers.join(","),
          ...emailData.map((item) => {
            const result = item.validationResult
            return [
              `"${item.email}"`,
              item.isValid ? "Yes" : "No",
              result?.score || 0,
              result?.format?.status || "unknown",
              result?.domain?.status || "unknown",
              result?.disposable?.status || "unknown",
              result?.risk?.status || "unknown",
              result?.company?.name ? `"${result.company.name}"` : "",
              result?.company?.industry ? `"${result.company.industry}"` : "",
              result?.activity?.lastActive ? `"${result.activity.lastActive}"` : "",
              result?.cached ? "Yes" : "No",
            ].join(",")
          }),
        ]

        csvContent = "data:text/csv;charset=utf-8," + rows.join("\n")
      } else {
        // Simple email list export
        const headers = ["Email", "Valid", "Score", "Cached"]

        const rows = [
          headers.join(","),
          ...emailData.map((item) => {
            return [
              `"${item.email}"`,
              item.isValid ? "Yes" : "No",
              item.validationResult?.score || 0,
              item.validationResult?.cached ? "Yes" : "No",
            ].join(",")
          }),
        ]

        csvContent = "data:text/csv;charset=utf-8," + rows.join("\n")
      }
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Complete",
      description: `Data exported to ${filename}.`,
    })
  }

  // List management
  const saveCurrentList = () => {
    if (!newListName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your list.",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails = inputText.match(emailRegex) || []

    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "No email addresses found to save.",
        variant: "destructive",
      })
      return
    }

    // Check if list name already exists
    if (savedLists.some((list) => list.name === newListName)) {
      toast({
        title: "Error",
        description: "A list with this name already exists.",
        variant: "destructive",
      })
      return
    }

    const newList: SavedList = {
      id: Date.now().toString(),
      name: newListName,
      emails: emails,
      createdAt: new Date().toISOString(),
    }

    setSavedLists((prev) => [...prev, newList])
    setNewListName("")

    toast({
      title: "List Saved",
      description: `Saved ${emails.length} email addresses to "${newListName}".`,
    })
  }

  const addToExistingList = () => {
    if (!selectedListForAdd) {
      toast({
        title: "Error",
        description: "Please select a list.",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails = inputText.match(emailRegex) || []

    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "No email addresses found to add.",
        variant: "destructive",
      })
      return
    }

    setSavedLists((prev) =>
      prev.map((list) => {
        if (list.id === selectedListForAdd) {
          // Add emails to list, avoiding duplicates
          const combinedEmails = [...new Set([...list.emails, ...emails])]
          return {
            ...list,
            emails: combinedEmails,
          }
        }
        return list
      }),
    )

    setShowAddToExistingListDialog(false)
    setSelectedListForAdd("")

    const selectedList = savedLists.find((list) => list.id === selectedListForAdd)

    toast({
      title: "Emails Added",
      description: `Added emails to "${selectedList?.name}".`,
    })
  }

  const loadSavedList = (list: SavedList) => {
    setInputText(list.emails.join("\n"))

    toast({
      title: "List Loaded",
      description: `Loaded ${list.emails.length} email addresses from "${list.name}".`,
    })
  }

  const mergeLists = (list1Id: string, list2Id: string) => {
    const list1 = savedLists.find((list) => list.id === list1Id)
    const list2 = savedLists.find((list) => list.id === list2Id)

    if (!list1 || !list2) {
      toast({
        title: "Error",
        description: "One or both lists not found.",
        variant: "destructive",
      })
      return
    }

    // Combine emails, removing duplicates
    const combinedEmails = [...new Set([...list1.emails, ...list2.emails])]

    // Create new merged list
    const newList: SavedList = {
      id: Date.now().toString(),
      name: `${list1.name} + ${list2.name}`,
      emails: combinedEmails,
      createdAt: new Date().toISOString(),
    }

    setSavedLists((prev) => [...prev, newList])

    toast({
      title: "Lists Merged",
      description: `Combined "${list1.name}" and "${list2.name}" into a new list with ${combinedEmails.length} emails.`,
    })
  }

  const deleteSavedList = (id: string) => {
    setSavedLists((prev) => prev.filter((list) => list.id !== id))

    toast({
      title: "List Deleted",
      description: "The email list has been deleted.",
    })
  }

  // File handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInputText(content)

      toast({
        title: "File Imported",
        description: `Successfully imported ${file.name}.`,
      })
    }
    reader.readAsText(file)
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string

      // Parse CSV content
      try {
        const lines = content.split(/\r\n|\n/)
        const emailColumn = lines[0].split(",").findIndex((header) => header.toLowerCase().includes("email"))

        // Default to first column if no email column found
        const columnIndex = emailColumn >= 0 ? emailColumn : 0

        // Extract emails from the identified column, skipping header
        const emails = lines
          .slice(1)
          .map((line) => {
            const columns = line.split(",")
            return columns[columnIndex]?.trim().replace(/^"|"$/g, "") || ""
          })
          .filter((email) => email.includes("@"))

        setInputText(emails.join("\n"))

        toast({
          title: "CSV Imported",
          description: `Successfully extracted ${emails.length} emails from ${file.name}.`,
        })
      } catch (error) {
        console.error("Error parsing CSV:", error)
        toast({
          title: "Import Error",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const triggerCSVUpload = () => {
    csvFileInputRef.current?.click()
  }

  // Sharing functionality
  const shareList = () => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails = inputText.match(emailRegex) || []

    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "No email addresses found to share.",
        variant: "destructive",
      })
      return
    }

    // Create a shareable URL with the emails encoded
    const encodedEmails = encodeURIComponent(emails.join("\n"))
    const url = `${window.location.origin}?emails=${encodedEmails}`
    setShareUrl(url)
    setShowShareDialog(true)
  }

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)

    toast({
      title: "URL Copied",
      description: "Shareable URL copied to clipboard.",
    })
  }

  // Sorting and filtering
  const sortEmails = (emails: EmailStatus[]) => {
    const sortedEmails = [...emails]

    switch (listSortOrder) {
      case "score":
        return sortedEmails.sort((a, b) => {
          const scoreA = a.validationResult?.score || 0
          const scoreB = b.validationResult?.score || 0
          return scoreB - scoreA // Higher scores first
        })
      case "name":
        return sortedEmails.sort((a, b) => a.email.localeCompare(b.email))
      case "status":
        return sortedEmails.sort((a, b) => {
          if (a.isValid === b.isValid) return 0
          return a.isValid ? -1 : 1 // Valid emails first
        })
      default:
        return sortedEmails
    }
  }

  // Batch operations
  const revalidateSelectedEmails = async (emails: EmailStatus[]) => {
    if (emails.length === 0) return

    setIsValidating(true)
    setValidationProgress(0)

    const revalidatedEmails: EmailStatus[] = []

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i].email
      try {
        const validationResult = await validateEmail(email, {
          checkMxRecords: validationSettings.checkMxRecords,
          checkDisposable: validationSettings.checkDisposable,
          performRiskAssessment: validationSettings.performRiskAssessment,
          fetchCompanyInfo: validationSettings.fetchCompanyInfo,
          checkEmailActivity: validationSettings.checkEmailActivity,
          useCache: false, // Force revalidation
        })

        revalidatedEmails.push({
          email,
          validationResult,
          isValid: validationResult.score >= validationSettings.scoreThreshold,
        })
      } catch (error) {
        console.error(`Error validating ${email}:`, error)
        revalidatedEmails.push({
          email,
          validationResult: null,
          isValid: false,
        })
      }

      // Update progress
      setValidationProgress(Math.round(((i + 1) / emails.length) * 100))
    }

    // Update only the revalidated emails
    setExtractedEmails((prev) => {
      const emailMap = new Map(revalidatedEmails.map((item) => [item.email, item]))
      return prev.map((item) => emailMap.get(item.email) || item)
    })

    setIsValidating(false)
    updateCacheStats()

    toast({
      title: "Revalidation Complete",
      description: `Revalidated ${revalidatedEmails.length} email addresses.`,
    })
  }

  // Display logic and filtering
  const getFilteredEmails = () => {
    let filtered = showOnlyValid ? extractedEmails.filter((item) => item.isValid) : extractedEmails

    // Apply search filter
    filtered = filtered.filter((item) => item.email.toLowerCase().includes(searchTerm.toLowerCase()))

    // Apply advanced filters
    if (filterScoreMin > 0) {
      filtered = filtered.filter((item) => (item.validationResult?.score || 0) >= filterScoreMin)
    }

    if (filterDomainStatus) {
      filtered = filtered.filter((item) => item.validationResult?.domain?.status === filterDomainStatus)
    }

    if (filterDisposableStatus) {
      filtered = filtered.filter((item) => item.validationResult?.disposable?.status === filterDisposableStatus)
    }

    // Apply sorting
    return sortEmails(filtered)
  }

  const filteredEmails = getFilteredEmails()
  const validCount = extractedEmails.filter((item) => item.isValid).length
  const invalidCount = extractedEmails.length - validCount
  const cachedEmailsCount = extractedEmails.filter((item) => item.validationResult?.cached).length

  return (
    <div className="max-w-5xl mx-auto p-4">
      <Card className="transition-colors duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Unified Email Validator & Comparator</CardTitle>
            <CardDescription>
              Comprehensive email validation, comparison, and management tool with real MX checking
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Database className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Cache Management</DropdownMenuLabel>
                <DropdownMenuItem onClick={updateCacheStats}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCleanupCache}>
                  <Database className="h-4 w-4 mr-2" />
                  Cleanup Expired
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearCache} className="text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Cache
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </CardHeader>
        <CardContent>
          {cacheStats.total > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span>
                  Cache: {cacheStats.valid} valid, {cacheStats.expired} expired
                </span>
                <Badge variant="outline">{cachedEmailsCount} cached results in current list</Badge>
              </div>
            </div>
          )}

          <Tabs defaultValue="validate" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="validate">Validate</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
              <TabsTrigger value="saved">Saved Lists</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="validate" className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="input-text" className="block text-sm font-medium">
                        Paste text with email addresses:
                      </label>
                      <div className="flex space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Import
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={triggerFileUpload}>Text File (.txt)</DropdownMenuItem>
                            <DropdownMenuItem onClick={triggerCSVUpload}>CSV File (.csv)</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".txt"
                          onChange={handleFileUpload}
                        />
                        <input
                          type="file"
                          ref={csvFileInputRef}
                          className="hidden"
                          accept=".csv"
                          onChange={handleCSVUpload}
                        />
                        <Button variant="outline" size="sm" onClick={shareList}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      id="input-text"
                      placeholder="Paste text here... emails will be automatically extracted"
                      className="min-h-[150px]"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter list name to save"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={saveCurrentList}>
                      <Save className="h-4 w-4 mr-2" />
                      Save as New List
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (savedLists.length > 0) {
                          setShowAddToExistingListDialog(true)
                        } else {
                          toast({
                            title: "No Saved Lists",
                            description: "Create a saved list first.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Add to Existing
                    </Button>
                  </div>

                  <Button onClick={extractAndValidateEmails} className="w-full" disabled={isValidating}>
                    <FileText className="mr-2 h-4 w-4" />
                    {isValidating ? "Validating..." : "Extract & Validate Email Addresses"}
                  </Button>

                  {isValidating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Validating emails...</span>
                        <span>{validationProgress}%</span>
                      </div>
                      <Progress value={validationProgress} />
                    </div>
                  )}

                  {extractedEmails.length > 0 && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900">
                            <Check className="h-3 w-3 mr-1 text-green-500" /> {validCount} Valid
                          </Badge>
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900">
                            <X className="h-3 w-3 mr-1 text-red-500" /> {invalidCount} Invalid
                          </Badge>
                          <Badge variant="outline">
                            {Math.round((validCount / extractedEmails.length) * 100)}% Success Rate
                          </Badge>
                          {cachedEmailsCount > 0 && (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900">
                              <Database className="h-3 w-3 mr-1 text-blue-500" /> {cachedEmailsCount} Cached
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="show-valid" checked={showOnlyValid} onCheckedChange={setShowOnlyValid} />
                          <Label htmlFor="show-valid" className="text-sm">
                            Show only valid emails
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex-1">
                            <Input
                              id="search-emails"
                              type="text"
                              placeholder="Search emails..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>

                          <div className="flex space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <ChevronsUpDown className="h-4 w-4 mr-2" />
                                  Sort:{" "}
                                  {listSortOrder === "score" ? "Score" : listSortOrder === "name" ? "Name" : "Status"}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setListSortOrder("score")}>
                                  Sort by Score
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setListSortOrder("name")}>
                                  Sort Alphabetically
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setListSortOrder("status")}>
                                  Sort by Status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Collapsible
                              open={isAdvancedFiltersOpen}
                              onOpenChange={setIsAdvancedFiltersOpen}
                              className="w-[180px]"
                            >
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Filter className="h-4 w-4 mr-2" />
                                  {isAdvancedFiltersOpen ? "Hide Filters" : "Filters"}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2 space-y-2 border p-2 rounded-md">
                                <div className="space-y-1">
                                  <Label className="text-xs">Minimum Score: {filterScoreMin}</Label>
                                  <Slider
                                    value={[filterScoreMin]}
                                    onValueChange={(value) => setFilterScoreMin(value[0])}
                                    min={0}
                                    max={100}
                                    step={5}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Domain Status</Label>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                                        {filterDomainStatus || "Any"}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => setFilterDomainStatus(null)}>
                                        Any
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setFilterDomainStatus("valid")}>
                                        Valid
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setFilterDomainStatus("warning")}>
                                        Warning
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setFilterDomainStatus("invalid")}>
                                        Invalid
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Disposable Email</Label>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                                        {filterDisposableStatus || "Any"}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => setFilterDisposableStatus(null)}>
                                        Any
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setFilterDisposableStatus("valid")}>
                                        Not Disposable
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setFilterDisposableStatus("invalid")}>
                                        Disposable
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="w-full"
                                  onClick={() => {
                                    setFilterScoreMin(0)
                                    setFilterDomainStatus(null)
                                    setFilterDisposableStatus(null)
                                  }}
                                >
                                  Reset Filters
                                </Button>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </div>

                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            Showing {filteredEmails.length} of {extractedEmails.length} emails
                          </span>
                          {filteredEmails.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revalidateSelectedEmails(filteredEmails)}
                              disabled={isValidating}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Revalidate
                            </Button>
                          )}
                        </div>

                        <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto">
                          {filteredEmails.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No emails match your current filters</p>
                            </div>
                          ) : (
                            <>
                              {filteredEmails.map((item, index) => (
                                <motion.div
                                  key={item.email}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.02 }}
                                  className={`flex items-center p-1 ${index % 2 === 0 ? "bg-muted/50" : ""}`}
                                >
                                  {item.validationResult ? (
                                    <>
                                      {item.validationResult.score >= 80 ? (
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                      ) : item.validationResult.score >= 60 ? (
                                        <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                                      ) : (
                                        <X className="h-4 w-4 mr-2 text-red-500" />
                                      )}
                                      <span
                                        className={
                                          item.validationResult.score >= 80
                                            ? "text-green-600 dark:text-green-400"
                                            : item.validationResult.score >= 60
                                              ? "text-yellow-600 dark:text-yellow-400"
                                              : "text-red-600 dark:text-red-400"
                                        }
                                      >
                                        {item.email}
                                      </span>
                                      <Badge className="ml-2 text-xs" variant="outline">
                                        {item.validationResult.score}%
                                      </Badge>
                                      {item.validationResult.cached && (
                                        <Badge className="ml-1 text-xs" variant="outline">
                                          <Database className="h-3 w-3 mr-1" />
                                          Cached
                                        </Badge>
                                      )}
                                      {item.validationResult && (
                                        <EmailDetailsModal
                                          email={item.email}
                                          validationResult={item.validationResult}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-4 w-4 mr-2 text-red-500" />
                                      <span className="text-red-600 dark:text-red-400">{item.email}</span>
                                      <Badge className="ml-2 text-xs" variant="outline">
                                        Failed
                                      </Badge>
                                    </>
                                  )}
                                </motion.div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToCSV(filteredEmails, "email_list.csv")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Basic CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToCSV(filteredEmails, "email_validation_detailed.csv", true)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Detailed CSV
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="compare" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="input-text-1" className="block text-sm font-medium mb-2">
                        List 1:
                      </label>
                      <Textarea
                        id="input-text-1"
                        placeholder="Paste first list here..."
                        className="min-h-[200px]"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      {savedLists.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-2">
                              Load From Saved Lists
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {savedLists.map((list) => (
                              <DropdownMenuItem key={list.id} onClick={() => setInputText(list.emails.join("\n"))}>
                                {list.name} ({list.emails.length})
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div>
                      <label htmlFor="input-text-2" className="block text-sm font-medium mb-2">
                        List 2:
                      </label>
                      <Textarea
                        id="input-text-2"
                        placeholder="Paste second list here..."
                        className="min-h-[200px]"
                        value={inputText2}
                        onChange={(e) => setInputText2(e.target.value)}
                      />
                      {savedLists.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-2">
                              Load From Saved Lists
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {savedLists.map((list) => (
                              <DropdownMenuItem key={list.id} onClick={() => setInputText2(list.emails.join("\n"))}>
                                {list.name} ({list.emails.length})
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  <Button onClick={compareEmailLists} className="w-full" disabled={isComparing}>
                    <CompareArrows className="mr-2 h-4 w-4" />
                    {isComparing ? "Comparing..." : "Compare Email Lists"}
                  </Button>

                  {comparisonResult && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Comparison Results:</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {["duplicates", "uniqueToList1", "uniqueToList2"].map((category) => (
                            <div key={category}>
                              <h4 className="text-md font-medium mb-1">
                                {category === "duplicates"
                                  ? "Duplicates"
                                  : category === "uniqueToList1"
                                    ? "Unique to List 1"
                                    : "Unique to List 2"}
                                ({comparisonResult[category].length})
                              </h4>
                              <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                                {comparisonResult[category].length === 0 ? (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <p>No emails found</p>
                                  </div>
                                ) : (
                                  <>
                                    {comparisonResult[category].map((email, index) => (
                                      <motion.div
                                        key={email}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.02 }}
                                        className={`p-1 ${index % 2 === 0 ? "bg-muted/50" : ""}`}
                                      >
                                        {email}
                                      </motion.div>
                                    ))}
                                  </>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 bg-transparent"
                                onClick={() => exportToCSV(comparisonResult[category], `${category}.csv`)}
                                disabled={comparisonResult[category].length === 0}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="space-y-4">
                  {savedLists.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No saved lists yet. Save a list from the Validate tab.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedLists.map((list) => (
                        <Card key={list.id}>
                          <CardHeader className="py-4">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">{list.name}</CardTitle>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => loadSavedList(list)}>
                                    Load in Editor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      exportToCSV(list.emails, `${list.name.replace(/\s+/g, "_")}.csv`)
                                    }}
                                  >
                                    Export as CSV
                                  </DropdownMenuItem>
                                  {savedLists.length > 1 && (
                                    <DropdownMenuSub>
                                      <DropdownMenuTrigger>Merge With...</DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        {savedLists
                                          .filter((otherList) => otherList.id !== list.id)
                                          .map((otherList) => (
                                            <DropdownMenuItem
                                              key={otherList.id}
                                              onClick={() => mergeLists(list.id, otherList.id)}
                                            >
                                              {otherList.name}
                                            </DropdownMenuItem>
                                          ))}
                                      </DropdownMenuContent>
                                    </DropdownMenuSub>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => deleteSavedList(list.id)}
                                  >
                                    Delete List
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <CardDescription>
                              {list.emails.length} emails • Created {new Date(list.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="border rounded-md p-2 max-h-[100px] overflow-y-auto text-sm text-muted-foreground">
                              <p>
                                {list.emails.slice(0, 5).join(", ")}
                                {list.emails.length > 5 ? `, ... and ${list.emails.length - 5} more` : ""}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 p-3">
                      <h3 className="font-medium">Validation History</h3>
                    </div>
                    {validationHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No validation history yet. Validate some emails to see your history.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {validationHistory.map((entry, idx) => (
                          <div key={idx} className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{new Date(entry.date).toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                Validated {entry.emailCount} emails ({entry.validCount} valid, {entry.invalidCount}{" "}
                                invalid)
                                {entry.cachedCount && entry.cachedCount > 0 && ` • ${entry.cachedCount} from cache`}
                              </p>
                            </div>
                            <div>
                              <Badge>{Math.round((entry.validCount / entry.emailCount) * 100)}% Success Rate</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(filteredEmails)}
              disabled={filteredEmails.length === 0}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={filteredEmails.length === 0}>
                  <Send className="mr-2 h-4 w-4" />
                  Open in Email Client
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Choose Email Client</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.setItem("emailClientPreference", "outlook")
                    openEmailClient(filteredEmails)
                  }}
                >
                  Outlook
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.setItem("emailClientPreference", "gmail")
                    openEmailClient(filteredEmails)
                  }}
                >
                  Gmail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.setItem("emailClientPreference", "yahoo")
                    openEmailClient(filteredEmails)
                  }}
                >
                  Yahoo Mail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.setItem("emailClientPreference", "default")
                    openEmailClient(filteredEmails)
                  }}
                >
                  Default Email Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>

      {/* Validation Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validation Settings</DialogTitle>
            <DialogDescription>Configure how email validation works</DialogDescription>
          </DialogHeader>
          <ValidationSettingsComponent settings={validationSettings} onSettingsChange={setValidationSettings} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Email List</DialogTitle>
            <DialogDescription>Share this URL to give someone access to your current email list.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={shareUrl} readOnly />
            <Button variant="outline" onClick={copyShareUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Existing List Dialog */}
      <Dialog open={showAddToExistingListDialog} onOpenChange={setShowAddToExistingListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Existing List</DialogTitle>
            <DialogDescription>Select a list to add the current emails to</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {savedLists.map((list) => (
              <div
                key={list.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedListForAdd === list.id ? "border-primary bg-muted" : ""
                }`}
                onClick={() => setSelectedListForAdd(list.id)}
              >
                <p className="font-medium">{list.name}</p>
                <p className="text-sm text-muted-foreground">{list.emails.length} emails</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAddToExistingListDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addToExistingList} disabled={!selectedListForAdd}>
              Add to Selected List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
