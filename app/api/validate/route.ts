import { type NextRequest, NextResponse } from "next/server"
import { validateEmail } from "@/lib/email-validator"

export async function GET(request: NextRequest) {
  // Get email from query parameters
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get("email")

  // Check if email is provided
  if (!email) {
    return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
  }

  try {
    // Validate the email
    const result = await validateEmail(email)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Email validation error:", error)
    return NextResponse.json({ error: "Failed to validate email" }, { status: 500 })
  }
}
