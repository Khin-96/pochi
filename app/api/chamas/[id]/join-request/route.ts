import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?._id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: chamaId } = params;
    
    if (!ObjectId.isValid(chamaId)) {
      return NextResponse.json(
        { error: "Invalid Chama ID format" },
        { status: 400 }
      );
    }

    const { reason } = await request.json();
    
    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // Check if chama exists and is private
    const chama = await db.collection("chamas").findOne({
      _id: new ObjectId(chamaId),
      type: "private"
    });

    if (!chama) {
      return NextResponse.json(
        { error: "Private chama not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const isMember = chama.members.some(
      (m: any) => m.userId.toString() === user._id.toString()
    );

    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this chama" },
        { status: 400 }
      );
    }

    // Check if user already has a pending request
    const existingRequest = await db.collection("join_requests").findOne({
      chamaId: new ObjectId(chamaId),
      userId: user._id,
      status: "pending"
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request to join this chama" },
        { status: 400 }
      );
    }

    // Create join request
    const joinRequest = {
      chamaId: new ObjectId(chamaId),
      userId: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      reason: reason || "I would like to join this chama",
      status: "pending",
      requestDate: new Date(),
    };

    await db.collection("join_requests").insertOne(joinRequest);

    return NextResponse.json({
      message: "Join request sent successfully. Waiting for admin approval."
    });

  } catch (error) {
    console.error("Join request error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}