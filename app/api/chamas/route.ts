import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { findChamasByUserId, createChama } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const chamas = await findChamasByUserId(user._id as string)

    return NextResponse.json({ success: true, chamas })
  } catch (error) {
    console.error("Get chamas error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get chamas",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()

    const chama = await createChama(body, user._id as string, user.name)

    return NextResponse.json({ success: true, chama }, { status: 201 })
  } catch (error) {
    console.error("Create chama error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create chama",
      },
      { status: 500 },
    )
  }
}
