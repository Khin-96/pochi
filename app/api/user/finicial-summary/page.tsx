import { NextApiRequest, NextApiResponse } from "next"
import { getCurrentUser } from "@/lib/auth"
import { findUserById, findTransactionsByUserId, findSavingsGoalsByUserId } from "@/lib/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const [transactions, savingsGoals] = await Promise.all([
      findTransactionsByUserId(user._id),
      findSavingsGoalsByUserId(user._id)
    ])

    res.status(200).json({
      balance: user.balance,
      recentTransactions: transactions.slice(0, 5).map(t => ({
        amount: t.amount,
        description: t.description,
        date: t.date
      })),
      savingsGoals: savingsGoals.map(g => ({
        name: g.name,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        deadline: g.deadline
      }))
    })
  } catch (error) {
    console.error("Error fetching financial summary:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}