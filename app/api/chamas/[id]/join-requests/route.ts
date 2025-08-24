import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(
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

    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // Check if user is admin of this chama
    const chama = await db.collection("chamas").findOne({
      _id: new ObjectId(chamaId),
      "members.userId": user._id,
      "members.role": "admin"
    });

    if (!chama) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get pending join requests
    const requests = await db.collection("join_requests")
      .find({
        chamaId: new ObjectId(chamaId),
        status: "pending"
      })
      .sort({ requestDate: -1 })
      .toArray();

    // Transform the data
    const transformedRequests = requests.map(request => ({
      id: request._id.toString(),
      userId: request.userId.toString(),
      userName: request.userName,
      userAvatar: request.userAvatar,
      reason: request.reason,
      status: request.status,
      requestDate: request.requestDate.toISOString()
    }));

    return NextResponse.json({ requests: transformedRequests });

  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}