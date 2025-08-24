import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { updateJoinRequestStatus, getJoinRequestById } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?._id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: chamaId, requestId } = params;
    
    if (!ObjectId.isValid(chamaId) || !ObjectId.isValid(requestId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
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

    // Get the join request
    const joinRequest = await getJoinRequestById(requestId);
    
    if (!joinRequest || joinRequest.chamaId.toString() !== chamaId) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // Update request status
    await updateJoinRequestStatus(requestId, "rejected");

    return NextResponse.json({
      message: "Join request rejected successfully"
    });

  } catch (error) {
    console.error("Reject join request error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}