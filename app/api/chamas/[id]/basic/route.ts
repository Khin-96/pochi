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

    const chama = await db.collection("chamas").findOne(
      { _id: new ObjectId(chamaId) },
      { projection: { name: 1, memberCount: 1, maxMembers: 1, members: 1 } }
    )

    if (!chama) {
      return NextResponse.json(
        { error: "Chama not found" },
        { status: 404 }
      )
    }

    const isMember = chama.members.some(
      (m: any) => m.userId?.toString() === user._id.toString()
    )

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied: You are not a member of this Chama" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: chama._id.toString(),
      name: chama.name,
      memberCount: chama.memberCount,
      maxMembers: chama.maxMembers
    })

  } catch (error) {
    console.error("Chama Info Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}