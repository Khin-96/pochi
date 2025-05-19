import { type NextRequest, NextResponse } from "next/server"
import { signUp } from "@/lib/auth"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validatedData = signupSchema.parse(body)

    // Create user
    const user = await signUp(validatedData)

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create user",
      },
      { status: 400 },
    )
  }
}
