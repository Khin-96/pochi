import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { findPublicChamas } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const chamas = await findPublicChamas()

    return NextResponse.json({ success: true, chamas })
  } catch (error) {
    console.error("Get public chamas error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get public chamas",
      },
      { status: 500 },
    )
  }
}
