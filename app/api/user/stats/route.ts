import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("pochiyangu");
    
    // Get user's chama count
    const chamasJoined = await db.collection("chamas").countDocuments({
      "members.userId": session.user.id
    });

    // Get user's total savings (balance)
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(session.user.id) 
    });

    // Get total investments (sum of investment amounts)
    const investments = await db.collection("investments").find({
      userId: session.user.id
    }).toArray();
    
    const totalInvestments = investments.reduce((sum, investment) => sum + investment.amount, 0);

    // Get active loans count
    const activeLoans = await db.collection("loans").countDocuments({
      userId: session.user.id,
      status: { $in: ["active", "pending"] }
    });

    return NextResponse.json({
      chamasJoined,
      totalSavings: user?.balance || 0,
      totalInvestments,
      activeLoans,
      currency: "KES"
    });
  } catch (error) {
    console.error("User stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}