import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { findUserById } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    // Get fresh user data from DB
    const dbUser = await findUserById(user._id)
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      balance: dbUser.balance,
      currency: "KES"
    })
  } catch (error) {
    console.error("Balance fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    )
  }
}