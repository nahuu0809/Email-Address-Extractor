"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function ApiDocs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Validation API Documentation</CardTitle>
        <CardDescription>
          Learn how to use our comprehensive email validation API to verify email addresses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="response">Response Format</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="prose dark:prose-invert max-w-none">
              <h3>Email Validation API</h3>
              <p>
                Our Email Validation API provides a comprehensive solution for validating email addresses through
                multiple layers of verification. The API performs various checks to ensure the accuracy and reliability
                of email addresses.
              </p>

              <h4>Key Features</h4>
              <ul>
                <li>
                  <strong>Format Validation:</strong> Checks for syntax errors and ensures the email address adheres to
                  standard formatting rules.
                </li>
                <li>
                  <strong>Domain Verification:</strong> Confirms the existence and validity of the email's domain,
                  including checks for DNS records and MX records.
                </li>
                <li>
                  <strong>Disposable Email Detection:</strong> Identifies and flags email addresses associated with
                  temporary or disposable email services.
                </li>
                <li>
                  <strong>Risk Assessment:</strong> Analyzes the email address for potential risks, such as blacklisting
                  or association with known spam sources.
                </li>
                <li>
                  <strong>Company Information:</strong> Provides detailed information about the email's origin,
                  including the company associated with the domain.
                </li>
                <li>
                  <strong>Email Activity Check:</strong> Attempts to determine the last time the email inbox was
                  actively used or accessed.
                </li>
              </ul>

              <h4>Use Cases</h4>
              <ul>
                <li>Form validation to prevent fake signups</li>
                <li>Email list cleaning and verification</li>
                <li>Fraud prevention in e-commerce</li>
                <li>Lead qualification for sales and marketing</li>
                <li>Customer data verification</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">GET</Badge>
                  <code className="text-sm font-mono">/api/validate</code>
                </div>
                <p className="text-sm mb-3">
                  Validates a single email address and returns comprehensive validation results.
                </p>

                <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Parameter</div>
                  <div className="font-medium">Required</div>
                  <div className="font-medium">Description</div>

                  <div>email</div>
                  <div>Yes</div>
                  <div>The email address to validate</div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">POST</Badge>
                  <code className="text-sm font-mono">/api/validate/bulk</code>
                </div>
                <p className="text-sm mb-3">Validates multiple email addresses in a single request.</p>

                <h4 className="text-sm font-medium mb-2">Request Body</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Parameter</div>
                  <div className="font-medium">Required</div>
                  <div className="font-medium">Description</div>

                  <div>emails</div>
                  <div>Yes</div>
                  <div>Array of email addresses to validate</div>
                </div>

                <h4 className="text-sm font-medium mt-3 mb-2">Example Request</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {`{
  "emails": [
    "user@example.com",
    "info@company.org",
    "invalid-email"
  ]
}`}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="response">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Response Format</h3>
              <p className="text-sm">The API returns a JSON object with the following structure:</p>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="response-format">
                  <AccordionTrigger>View Response Schema</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                      {`{
  "email": "string",       // The email address that was validated
  "score": "number",       // Overall validation score (0-100)
  "format": {              // Email format validation results
    "status": "string",    // "valid", "warning", or "invalid"
    "message": "string",   // Human-readable message
    "details": ["string"]  // Optional array of specific format issues
  },
  "domain": {              // Domain verification results
    "status": "string",    // "valid", "warning", or "invalid"
    "message": "string",   // Human-readable message
    "details": [           // Optional array of DNS records
      {
        "type": "string",  // Record type (MX, A, etc.)
        "value": "string"  // Record value
      }
    ]
  },
  "disposable": {          // Disposable email detection results
    "status": "string",    // "valid", "warning", or "invalid"
    "message": "string"    // Human-readable message
  },
  "risk": {                // Risk assessment results
    "status": "string",    // "valid", "warning", or "invalid"
    "message": "string",   // Human-readable message
    "details": ["string"]  // Optional array of risk factors
  },
  "company": {             // Company information (if available)
    "name": "string",      // Company name
    "industry": "string",  // Industry or sector
    "size": "string",      // Company size (small, medium, large)
    "website": "string"    // Company website URL
  },
  "activity": {            // Email activity information
    "message": "string",   // Activity status message
    "lastActive": "string" // Last activity timestamp (if available)
  }
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <h4 className="text-md font-medium mt-4">Status Codes</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="font-medium">Status Code</div>
                <div className="font-medium">Description</div>
                <div className="font-medium">Example</div>

                <div>200 OK</div>
                <div>The request was successful</div>
                <div>Email validation completed successfully</div>

                <div>400 Bad Request</div>
                <div>The request was invalid</div>
                <div>Missing email parameter</div>

                <div>429 Too Many Requests</div>
                <div>Rate limit exceeded</div>
                <div>Too many validation requests</div>

                <div>500 Internal Server Error</div>
                <div>Server error occurred</div>
                <div>Validation service unavailable</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Example Requests</h3>

              <div className="space-y-2">
                <h4 className="text-md font-medium">Single Email Validation</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {`// Using fetch
fetch('/api/validate?email=user@example.com')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Using axios
axios.get('/api/validate', {
  params: { email: 'user@example.com' }
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="text-md font-medium">Bulk Email Validation</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {`// Using fetch
fetch('/api/validate/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    emails: [
      'user@example.com',
      'info@company.org',
      'invalid-email'
    ]
  }),
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// Using axios
axios.post('/api/validate/bulk', {
  emails: [
    'user@example.com',
    'info@company.org',
    'invalid-email'
  ]
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
