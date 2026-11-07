"use client"

import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Info, Check, X, AlertTriangle, Building, Clock, Mail, ExternalLink } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ValidationResult {
  email: string
  score: number
  format: { status: string; message: string; details?: string[] }
  domain: { status: string; message: string; details?: any[] }
  disposable: { status: string; message: string }
  risk: { status: string; message: string; details?: string[] }
  company: { name: string; industry: string; size: string; website: string }
  activity: { message: string; lastActive: string }
}

interface EmailDetailsModalProps {
  email: string
  validationResult: ValidationResult
}

export default function EmailDetailsModal({ email, validationResult }: EmailDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatusIcon = (status: string) => {
    if (status === "valid") return <Check className="h-5 w-5 text-green-500" />
    if (status === "warning") return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <X className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (status: string) => {
    if (status === "valid")
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Valid</Badge>
    if (status === "warning")
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Warning</Badge>
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Invalid</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted" onClick={() => setIsOpen(true)}>
        <Info className="h-4 w-4" />
        <span className="sr-only">View validation details</span>
      </Button>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            {email}
          </DialogTitle>
          <DialogDescription>Comprehensive validation results and details</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Overall Validation Score</h3>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold ${
                  validationResult.score >= 80
                    ? "text-green-600"
                    : validationResult.score >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {validationResult.score}%
              </span>
              <Progress
                value={validationResult.score}
                className="w-32 h-2"
                indicatorClassName={getScoreColor(validationResult.score)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Format Validation */}
            <div className="border rounded-md p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getStatusIcon(validationResult.format.status)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Format Validation</h4>
                    {getStatusBadge(validationResult.format.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{validationResult.format.message}</p>
                  {validationResult.format.details && validationResult.format.details.length > 0 && (
                    <ul className="text-sm text-gray-500 dark:text-gray-400 mt-1 list-disc list-inside">
                      {validationResult.format.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Domain Verification */}
            <div className="border rounded-md p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getStatusIcon(validationResult.domain.status)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Domain Verification</h4>
                    {getStatusBadge(validationResult.domain.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{validationResult.domain.message}</p>
                  {validationResult.domain.details && validationResult.domain.details.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="domain-details">
                        <AccordionTrigger className="text-sm py-2">View DNS Details</AccordionTrigger>
                        <AccordionContent>
                          <div className="text-sm space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="font-medium">Record Type</div>
                              <div className="font-medium col-span-2">Value</div>
                              {validationResult.domain.details.map((record, i) => (
                                <React.Fragment key={i}>
                                  <div>{record.type}</div>
                                  <div className="col-span-2 break-all">{record.value}</div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </div>
            </div>

            {/* Disposable Email Check */}
            <div className="border rounded-md p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getStatusIcon(validationResult.disposable.status)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Disposable Email Check</h4>
                    {getStatusBadge(validationResult.disposable.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{validationResult.disposable.message}</p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="border rounded-md p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getStatusIcon(validationResult.risk.status)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Risk Assessment</h4>
                    {getStatusBadge(validationResult.risk.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{validationResult.risk.message}</p>
                  {validationResult.risk.details && validationResult.risk.details.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium mb-1">Risk Factors:</div>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.risk.details.map((factor, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100"
                          >
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="border rounded-md p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <Building className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Company Information</h4>
                  </div>
                  {validationResult.company.name ? (
                    <div className="text-sm space-y-1 mt-1">
                      <p>
                        <span className="font-medium">Name:</span> {validationResult.company.name}
                      </p>
                      {validationResult.company.industry && (
                        <p>
                          <span className="font-medium">Industry:</span> {validationResult.company.industry}
                        </p>
                      )}
                      {validationResult.company.size && (
                        <p>
                          <span className="font-medium">Size:</span> {validationResult.company.size}
                        </p>
                      )}
                      {validationResult.company.website && (
                        <p>
                          <span className="font-medium">Website:</span>{" "}
                          <a
                            href={validationResult.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline inline-flex items-center"
                          >
                            {validationResult.company.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">No company information available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Email Activity */}
            <div className="border rounded-md p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Email Activity</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{validationResult.activity.message}</p>
                  {validationResult.activity.lastActive && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Last activity:</span> {validationResult.activity.lastActive}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
