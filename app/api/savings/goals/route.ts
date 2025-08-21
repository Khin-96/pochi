import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { findSavingsGoalsByUserId } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await findSavingsGoalsByUserId(user._id);
    
    // Filter out goals with null userId or wrong userId
    const userGoals = goals.filter(goal => 
      goal.userId && goal.userId.toString() === user._id.toString()
    );
    
    return NextResponse.json({ 
      goals: userGoals || [],
      userBalance: user.balance 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch savings goals" },
      { status: 500 }
    );
  }
}