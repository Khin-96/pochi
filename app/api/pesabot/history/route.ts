import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getPesaBotChat, savePesaBotChat } from "@/lib/db"

export const dynamic = 'force-dynamic' // Ensure routes are dynamic if using cookies/auth

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" }, 
        { status: 401 }
      )
    }

    if (!user._id) {
      return NextResponse.json(
        { success: false, message: "User ID not available" },
        { status: 400 }
      )
    }

    const chat = await getPesaBotChat(user._id)

    return NextResponse.json({
      success: true,
      chat,
    })
  } catch (error) {
    console.error("Get chat history error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get chat history",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" }, 
        { status: 401 }
      )
    }

    if (!user._id) {
      return NextResponse.json(
        { success: false, message: "User ID not available" },
        { status: 400 }
      )
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, message: "Invalid messages format" },
        { status: 400 }
      )
    }

    await savePesaBotChat(user._id, messages)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Save chat history error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to save chat history",
      },
      { status: 500 },
    )
  }
}