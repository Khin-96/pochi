import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectToDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user?._id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { id: chamaId } = params
    if (!ObjectId.isValid(chamaId)) {
      return NextResponse.json(
        { error: "Invalid Chama ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    if (!db) {
      throw new Error("Database connection failed")
    }

    // Check if user is a member of this chama
    const isMember = await db.collection("chamas").countDocuments({
      _id: new ObjectId(chamaId),
      "members.userId": new ObjectId(user._id)
    })

    if (!isMember) {
      return NextResponse.json(
        { error: "Chama not found or access denied" },
        { status: 404 }
      )
    }

    const messages = await db
      .collection("chama_messages")
      .find({ chamaId: new ObjectId(chamaId) })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg._id.toString(),
        senderId: msg.senderId.toString(),
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        isPesaBot: msg.isPesaBot || false
      })).reverse()
    })

  } catch (error) {
    console.error("Chat History Error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}