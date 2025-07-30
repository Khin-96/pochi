import { type NextRequest, NextResponse } from "next/server"
import { login } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validatedData = loginSchema.parse(body)

    // Login user
    const user = await login(validatedData)

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to login",
      },
      { status: 401 },
    )
  }
}
