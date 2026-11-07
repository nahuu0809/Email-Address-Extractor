"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, X, AlertTriangle, Download, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export default function BulkValidator() {
  const [inputEmails, setInputEmails] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)

  const validateEmails = async () => {
    if (!inputEmails.trim()) return

    const emails = inputEmails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)

    if (emails.length === 0) return

    setIsValidating(true)
    setProgress(0)
    setResults(null)

    const validationResults = []

    for (let i = 0; i < emails.length; i++) {
      try {
        const response = await fetch(`/api/validate?email=${encodeURIComponent(emails[i])}`)
        const data = await response.json()
        validationResults.push(data)
      } catch (error) {
        validationResults.push({
          email: emails[i],
          score: 0,
          format: { status: "invalid", message: "Validation error" },
        })
      }

      setProgress(Math.round(((i + 1) / emails.length) * 100))
    }

    setResults(validationResults)
    setIsValidating(false)
  }

  const exportToCSV = () => {
    if (!results) return

    const headers = [
      "Email",
      "Score",
      "Format Status",
      "Domain Status",
      "Disposable Status",
      "Risk Status",
      "Company Name",
      "Industry",
    ]

    const csvRows = [
      headers.join(","),
      ...results.map((result) =>
        [
          `"${result.email}"`,
          result.score,
          result.format?.status || "unknown",
          result.domain?.status || "unknown",
          result.disposable?.status || "unknown",
          result.risk?.status || "unknown",
          result.company?.name ? `"${result.company.name}"` : "",
          result.company?.industry ? `"${result.company.industry}"` : "",
        ].join(","),
      ),
    ]

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "email_validation_results.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusIcon = (status) => {
    if (status === "valid") return <Check className="h-4 w-4 text-green-500" />
    if (status === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <X className="h-4 w-4 text-red-500" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Email Validation</CardTitle>
        <CardDescription>
          Validate multiple email addresses at once. Enter one email per line or separate with commas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter email addresses (one per line or comma-separated)"
          className="min-h-[150px]"
          value={inputEmails}
          onChange={(e) => setInputEmails(e.target.value)}
          disabled={isValidating}
        />

        <Button onClick={validateEmails} disabled={isValidating || !inputEmails.trim()} className="w-full">
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating... ({progress}%)
            </>
          ) : (
            "Validate Emails"
          )}
        </Button>

        {isValidating && <Progress value={progress} className="h-2" />}

        {results && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="border rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b flex justify-between items-center">
                <h3 className="font-medium">Results ({results.length} emails)</h3>
                <Button size="sm" variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Score</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Format</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Domain</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Disposable</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}
                      >
                        <td className="px-4 py-2 text-sm">{result.email}</td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            <span
                              className={`font-medium ${
                                result.score >= 80
                                  ? "text-green-600"
                                  : result.score >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {result.score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            {getStatusIcon(result.format?.status)}
                            <span className="ml-1">{result.format?.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            {getStatusIcon(result.domain?.status)}
                            <span className="ml-1">{result.domain?.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            {getStatusIcon(result.disposable?.status)}
                            <span className="ml-1">{result.disposable?.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            {getStatusIcon(result.risk?.status)}
                            <span className="ml-1">{result.risk?.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
