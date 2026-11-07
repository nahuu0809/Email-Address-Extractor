import { type NextRequest, NextResponse } from "next/server"
import { validateEmail } from "@/lib/email-validator"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Check if emails array is provided
    if (!body.emails || !Array.isArray(body.emails)) {
      return NextResponse.json({ error: "Emails array is required" }, { status: 400 })
    }

    // Limit the number of emails to validate at once
    const MAX_EMAILS = 100
    if (body.emails.length > MAX_EMAILS) {
      return NextResponse.json({ error: `Maximum of ${MAX_EMAILS} emails can be validated at once` }, { status: 400 })
    }

    // Validate each email
    const results = await Promise.all(
      body.emails.map(async (email: string) => {
        try {
          return await validateEmail(email)
        } catch (error) {
          return {
            email,
            score: 0,
            format: { status: "invalid", message: "Validation error" },
          }
        }
      }),
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Bulk email validation error:", error)
    return NextResponse.json({ error: "Failed to validate emails" }, { status: 500 })
  }
}
