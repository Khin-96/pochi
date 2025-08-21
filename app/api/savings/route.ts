import { getCurrentUser } from "@/lib/auth";
import { findSavingsGoalsByUserId, createSavingsGoal } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await findSavingsGoalsByUserId(user._id);
    
    return NextResponse.json({ 
      goals: goals || [], // Ensure always an array
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

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, targetAmount, deadline, category } = body;

    if (!name || !targetAmount || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, targetAmount, and category are required" },
        { status: 400 }
      );
    }

    // Use the createSavingsGoal function from your db module
    const newGoal = await createSavingsGoal({
      name,
      targetAmount: Number(targetAmount),
      deadline: deadline ? new Date(deadline) : undefined,
      category,
    }, user._id.toString()); // Pass the user ID

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error("Error creating savings goal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create savings goal" },
      { status: 500 }
    );
  }
}