"use client"

import { useState, useEffect } from "react"
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
  Moon,
  Sun,
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { validateEmail as validateEmailComprehensive } from "@/lib/email-validator"
// Import the EmailDetailsModal component
import EmailDetailsModal from "@/components/email-details-modal"

type ValidationResult = {
  email: string
  score: number
  format: { status: string; message: string; details?: string[] }
  domain: { status: string; message: string; details?: any[] }
  disposable: { status: string; message: string }
  risk: { status: string; message: string; details?: string[] }
  company: { name: string; industry: string; size: string; website: string }
  activity: { message: string; lastActive: string }
}

// Update the EmailStatus type to include the comprehensive validation results
type EmailStatus = {
  email: string
  validationResult: ValidationResult | null
  isValid: boolean
}

export default function EmailExtractor() {
  const [inputText, setInputText] = useState("")
  const [inputText2, setInputText2] = useState("")
  const [extractedEmails, setExtractedEmails] = useState<EmailStatus[]>([])
  const [comparisonResult, setComparisonResult] = useState<{
    duplicates: string[]
    uniqueToList1: string[]
    uniqueToList2: string[]
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showOnlyValid, setShowOnlyValid] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("validate")

  useEffect(() => {
    const savedData = localStorage.getItem("emailExtractorData")
    if (savedData) {
      const { inputText, inputText2, extractedEmails, comparisonResult } = JSON.parse(savedData)
      setInputText(inputText)
      setInputText2(inputText2)
      setExtractedEmails(extractedEmails)
      setComparisonResult(comparisonResult)
    }
  }, [])

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
    document.body.classList.toggle("dark", darkMode)
  }, [darkMode])

  // Update the extractAndValidateEmails function to use the new validation system
  const extractAndValidateEmails = async () => {
    setIsValidating(true)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails = inputText.match(emailRegex) || []
    const uniqueEmails = [...new Set(emails)]

    const validatedEmails = await Promise.all(
      uniqueEmails.map(async (email) => {
        try {
          const validationResult = await validateEmailComprehensive(email)

          return {
            email,
            validationResult,
            isValid: validationResult.score >= 70, // Consider emails with score >= 70 as valid
          }
        } catch (error) {
          console.error(`Error validating ${email}:`, error)
          return {
            email,
            validationResult: null,
            isValid: false,
          }
        }
      }),
    )

    setExtractedEmails(validatedEmails)
    setIsValidating(false)
  }

  // Update the compareEmailLists function to work with the new validation system
  const compareEmailLists = async () => {
    setIsComparing(true)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails1 = inputText.match(emailRegex) || []
    const emails2 = inputText2.match(emailRegex) || []

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
  }

  // Update the openOutlook function to use the new validation system
  const openOutlook = (emails: EmailStatus[]) => {
    if (emails.length > 0) {
      const validEmails = emails.filter((item) => item.isValid).map((item) => item.email)

      if (validEmails.length > 0) {
        const mailtoLink = `mailto:?bcc=${validEmails.join(",")}`
        window.open(mailtoLink)
      }
    }
  }

  // Update the copyToClipboard function to use the new validation system
  const copyToClipboard = (emails: EmailStatus[]) => {
    const emailText = emails.map((item) => item.email).join("; ")
    navigator.clipboard.writeText(emailText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportToCSV = (data: string[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," + data.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Update the display logic to show the comprehensive validation results
  const displayedEmails = showOnlyValid ? extractedEmails.filter((item) => item.isValid) : extractedEmails

  const filteredEmails = displayedEmails.filter((item) => item.email.toLowerCase().includes(searchTerm.toLowerCase()))

  const validCount = extractedEmails.filter((item) => item.isValid).length
  const invalidCount = extractedEmails.length - validCount

  return (
    <div className={`max-w-3xl mx-auto p-4 ${darkMode ? "dark" : ""}`}>
      <Card className="transition-colors duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Advanced Email Validator & Comparator</CardTitle>
            <CardDescription>Validate email addresses, compare lists, and identify duplicates.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="validate" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="validate">Validate Emails</TabsTrigger>
              <TabsTrigger value="compare">Compare Lists</TabsTrigger>
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
                  <div>
                    <label htmlFor="input-text" className="block text-sm font-medium mb-2">
                      Paste text with email addresses:
                    </label>
                    <Textarea
                      id="input-text"
                      placeholder="Paste text here..."
                      className="min-h-[200px]"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>

                  <Button onClick={extractAndValidateEmails} className="w-full" disabled={isValidating}>
                    <FileText className="mr-2 h-4 w-4" />
                    {isValidating ? "Validating..." : "Extract & Validate Email Addresses"}
                  </Button>

                  {extractedEmails.length > 0 && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900">
                            <Check className="h-3 w-3 mr-1 text-green-500" /> {validCount} Valid
                          </Badge>
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900">
                            <X className="h-3 w-3 mr-1 text-red-500" /> {invalidCount} Invalid
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="show-valid" checked={showOnlyValid} onCheckedChange={setShowOnlyValid} />
                          <Label htmlFor="show-valid" className="text-sm">
                            Show only valid emails
                          </Label>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="search-emails" className="block text-sm font-medium mb-2">
                          Search emails:
                        </label>
                        <Input
                          id="search-emails"
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                        <label htmlFor="extracted-emails" className="block text-sm font-medium mb-2">
                          Extracted Email Addresses ({filteredEmails.length}):
                        </label>
                        <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                          {/* Update the email rendering section to display the comprehensive validation results */}
                          {filteredEmails.map((item, index) => (
                            <motion.div
                              key={item.email}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className={`flex items-center p-1 ${
                                index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : ""
                              }`}
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
                                  <EmailDetailsModal email={item.email} validationResult={item.validationResult} />
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
                        </div>
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
                                {comparisonResult[category].map((email, index) => (
                                  <motion.div
                                    key={email}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className={`p-1 ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : ""}`}
                                  >
                                    {email}
                                  </motion.div>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => exportToCSV(comparisonResult[category], `${category}.csv`)}
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
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => copyToClipboard(filteredEmails.map((item) => item.email).join("; "))}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <Button onClick={() => openOutlook(filteredEmails.map((item) => item.email))}>
            <Send className="mr-2 h-4 w-4" />
            Open in Outlook
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
