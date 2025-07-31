import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { findTransactionsByUserId } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    const transactions = await findTransactionsByUserId(user._id)
    return NextResponse.json({
      transactions: transactions
        .slice(0, limit)
        .map(txn => ({
          id: txn._id?.toString(),
          amount: txn.amount,
          description: txn.description,
          date: txn.date?.toISOString(),
          type: txn.type
        }))
    })
  } catch (error) {
    console.error("Transactions fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}