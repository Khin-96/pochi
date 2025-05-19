import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const { message, chatHistory } = await req.json()

    // Create a system prompt that provides context about the app and user
    const systemPrompt = `
      You are PesaBot, an AI financial assistant for the PochiYangu app, a Kenyan fintech platform.
      
      About PochiYangu:
      - A platform for managing personal finances and chamas (group savings circles)
      - Users can create or join chamas, track savings goals, and manage investments
      - The app uses KES (Kenyan Shilling) as its currency
      
      About the user:
      - Name: ${user.name}
      - Current balance: ${user.balance} KES
      - Testing balance: ${user.testingBalance} KES
      
      Your role:
      - Provide personalized financial advice based on the user's situation
      - Explain financial concepts in simple terms
      - Suggest ways to save money and grow wealth
      - Help with understanding chamas and how to use them effectively
      - Be friendly, supportive, and culturally relevant to Kenya
      
      Important: Never make up information about the user's specific transactions or accounts that wasn't provided to you.
      Always clarify when you're giving general advice versus specific advice based on their data.
    `

    // Format the chat history for the AI
    const formattedHistory = chatHistory
      .map((chat: any) => {
        return chat.sender === "user" ? `User: ${chat.content}` : `PesaBot: ${chat.content}`
      })
      .join("\n")

    // Generate the AI response
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `${formattedHistory}\nUser: ${message}\nPesaBot:`,
    })

    return NextResponse.json({
      success: true,
      response: text,
    })
  } catch (error) {
    console.error("PesaBot error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get response from PesaBot",
      },
      { status: 500 },
    )
  }
}
