import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getPesaBotChat, savePesaBotChat } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const chat = await getPesaBotChat(user._id as string)

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
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const { messages } = await req.json()

    await savePesaBotChat(user._id as string, messages)

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
