"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function ValidationDetails() {
  return (
    <div className="max-w-3xl mx-auto p-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Email Validation and Comparison</CardTitle>
          <CardDescription>
            Understanding the multi-layer validation process and list comparison feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Comprehensive Email Validation</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Format Validation:</strong> Checks the format and structure of the email address
                  </li>
                  <li>
                    <strong>Domain Verification:</strong> Verifies if the domain has valid DNS and MX records
                  </li>
                  <li>
                    <strong>Disposable Email Detection:</strong> Identifies temporary or throwaway email addresses
                  </li>
                  <li>
                    <strong>Risk Assessment:</strong> Analyzes for potential spam or abuse indicators
                  </li>
                  <li>
                    <strong>Company Information:</strong> Provides details about the organization behind the email
                  </li>
                  <li>
                    <strong>Email Activity:</strong> Attempts to determine when the email was last active
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Validation Scoring System</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Format Validation:</strong> 30 points maximum
                  </li>
                  <li>
                    <strong>Domain Verification:</strong> 25 points maximum
                  </li>
                  <li>
                    <strong>Disposable Email Check:</strong> 15 points maximum
                  </li>
                  <li>
                    <strong>Risk Assessment:</strong> 20 points maximum
                  </li>
                  <li>
                    <strong>Company Information:</strong> 5 points maximum
                  </li>
                  <li>
                    <strong>Email Activity:</strong> 5 points maximum
                  </li>
                  <li>Emails with scores of 80+ are considered highly valid</li>
                  <li>Scores between 60-79 indicate potential issues</li>
                  <li>Scores below 60 suggest the email may be invalid or risky</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>List Comparison Feature</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Compares two lists of email addresses</li>
                  <li>Identifies duplicate emails present in both lists</li>
                  <li>Finds unique emails in each list</li>
                  <li>Helps prevent sending duplicate emails</li>
                  <li>Exports results to CSV for further analysis</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Technical Implementation</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Uses real DNS lookups to verify domain existence</li>
                  <li>Checks MX records to confirm email receiving capability</li>
                  <li>Maintains a database of known disposable email domains</li>
                  <li>Implements risk assessment algorithms to detect suspicious patterns</li>
                  <li>Provides company information for recognized domains</li>
                  <li>Uses efficient data structures for fast comparison operations</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>User Interface Features</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Dark mode toggle for better accessibility</li>
                  <li>Detailed validation results with visual indicators</li>
                  <li>Search functionality for large email lists</li>
                  <li>CSV export feature for comparison results</li>
                  <li>Local storage for data persistence</li>
                  <li>Responsive design for various screen sizes</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
