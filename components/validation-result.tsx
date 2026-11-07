"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, X, AlertTriangle, Building, Clock, Mail, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function ValidationResult({ result }) {
  const [expanded, setExpanded] = useState(true)

  if (!result) return null

  const { email, format, domain, disposable, risk, company, activity, score } = result

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatusIcon = (status) => {
    if (status === "valid") return <Check className="h-5 w-5 text-green-500" />
    if (status === "warning") return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <X className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (status) => {
    if (status === "valid")
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Valid</Badge>
    if (status === "warning")
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Warning</Badge>
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Invalid</Badge>
  }

  return (
    <motion.div
      className="mt-6 border rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">{email}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm">
            Overall Score: <span className="font-bold">{score}%</span>
          </div>
          <Progress value={score} className="w-24 h-2" indicatorClassName={getScoreColor(score)} />
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="p-0 h-8 w-8">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{getStatusIcon(format.status)}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">Format Validation</h4>
                  {getStatusBadge(format.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{format.message}</p>
                {format.details && (
                  <ul className="text-sm text-gray-500 dark:text-gray-400 mt-1 list-disc list-inside">
                    {format.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{getStatusIcon(domain.status)}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">Domain Verification</h4>
                  {getStatusBadge(domain.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{domain.message}</p>
                {domain.details && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="domain-details">
                      <AccordionTrigger className="text-sm py-2">View DNS Details</AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="font-medium">Record Type</div>
                            <div className="font-medium col-span-2">Value</div>

                            {domain.details.map((record, i) => (
                              <>
                                <div key={`type-${i}`}>{record.type}</div>
                                <div key={`value-${i}`} className="col-span-2 break-all">
                                  {record.value}
                                </div>
                              </>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{getStatusIcon(disposable.status)}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">Disposable Email Check</h4>
                  {getStatusBadge(disposable.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{disposable.message}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{getStatusIcon(risk.status)}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">Risk Assessment</h4>
                  {getStatusBadge(risk.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{risk.message}</p>
                {risk.details && (
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Risk Factors:</div>
                    <div className="flex flex-wrap gap-2">
                      {risk.details.map((factor, i) => (
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

            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <Building className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">Company Information</h4>
                </div>
                {company.name ? (
                  <div className="text-sm space-y-1 mt-1">
                    <p>
                      <span className="font-medium">Name:</span> {company.name}
                    </p>
                    {company.industry && (
                      <p>
                        <span className="font-medium">Industry:</span> {company.industry}
                      </p>
                    )}
                    {company.size && (
                      <p>
                        <span className="font-medium">Size:</span> {company.size}
                      </p>
                    )}
                    {company.website && (
                      <p>
                        <span className="font-medium">Website:</span>{" "}
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center"
                        >
                          {company.website.replace(/^https?:\/\//, "")}
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

            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">Email Activity</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.message}</p>
                {activity.lastActive && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">Last activity:</span> {activity.lastActive}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
