import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { findSavingsGoalsByUserId } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const goals = await findSavingsGoalsByUserId(user._id)
    return NextResponse.json({
      goals: goals.map(goal => ({
        id: goal._id?.toString(),
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: (goal.currentAmount / goal.targetAmount) * 100
      }))
    })
  } catch (error) {
    console.error("Savings goals error:", error)
    return NextResponse.json(
      { error: "Failed to fetch savings goals" },
      { status: 500 }
    )
  }
}