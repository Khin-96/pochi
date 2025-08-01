// app/api/chamas/[id]/chat/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectToDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { pusherServer } from "@/lib/pusher"

// POST /api/chamas/:id/chat - Send a new message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser()
    if (!user?._id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // 2. Validate the chama ID parameter
    const { id: chamaId } = params
    if (!ObjectId.isValid(chamaId)) {
      return NextResponse.json(
        { error: "Invalid Chama ID format" },
        { status: 400 }
      )
    }

    // 3. Parse request body
    const { content } = await request.json()
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    // 4. Connect to database
    const { db } = await connectToDatabase()
    if (!db) {
      throw new Error("Database connection failed")
    }

    // 5. Create message document
    const message = {
      chamaId: new ObjectId(chamaId),
      senderId: user._id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content,
      timestamp: new Date(),
      isPesaBot: false,
    };

    // 6. Insert message into database
    const result = await db.collection("chama_messages").insertOne(message)
    const insertedMessage = {
      ...message,
      _id: result.insertedId,
    };

    // 7. Trigger Pusher event
    await pusherServer.trigger(`chama-${chamaId}`, 'new-message', {
      id: insertedMessage._id.toString(),
      senderId: insertedMessage.senderId,
      senderName: insertedMessage.senderName,
      senderAvatar: insertedMessage.senderAvatar,
      content: insertedMessage.content,
      timestamp: insertedMessage.timestamp.toISOString(),
      isPesaBot: insertedMessage.isPesaBot,
    });

    return NextResponse.json({ message: "Message sent successfully" })

  } catch (error) {
    console.error("Send Message Error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}