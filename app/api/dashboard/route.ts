import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" }, 
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pochiyangu");

    // Get user data with all fields
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 404 }
      );
    }

    // Get user's chamas
    const chamas = await db.collection("chamas")
      .find({ "members.userId": session.user.id })
      .toArray();

    // Get user's transactions
    const transactions = await db.collection("transactions")
      .find({ userId: session.user.id })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance || 0,
        testingBalance: user.testingBalance || 1000,
        avatar: user.avatar
      },
      chamas: chamas.map(chama => ({
        id: chama._id.toString(),
        name: chama.name,
        type: chama.type,
        memberCount: chama.memberCount,
        maxMembers: chama.maxMembers,
        balance: chama.balance,
        nextContribution: chama.nextContribution
      })),
      transactions: transactions.map(transaction => ({
        id: transaction._id.toString(),
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        isTest: transaction.isTest
      }))
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get dashboard data",
      },
      { status: 500 },
    );
  }
}