// app/api/payments/frequent-recipients/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findTransactionsByUserId } from "@/lib/db";

export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch all transactions for the user
    const transactions = await findTransactionsByUserId(user._id);

    // Filter send transactions and aggregate frequent recipients
    const sendTransactions = transactions.filter(
      (txn) => txn.type === "send" && txn.counterparty && txn.counterpartyName
    );

    const recipientMap = new Map<string, { name: string; count: number; totalAmount: number }>();

    sendTransactions.forEach((txn) => {
      if (!txn.counterparty || !txn.counterpartyName) return;

      const existing = recipientMap.get(txn.counterparty) || {
        name: txn.counterpartyName,
        count: 0,
        totalAmount: 0,
      };

      recipientMap.set(txn.counterparty, {
        name: txn.counterpartyName,
        count: existing.count + 1,
        totalAmount: existing.totalAmount + txn.amount,
      });
    });

    // Convert map to array and sort by frequency
    const frequentRecipients = Array.from(recipientMap.entries())
      .map(([identifier, data]) => ({
        identifier,
        name: data.name,
        count: data.count,
        totalAmount: data.totalAmount,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ recipients: frequentRecipients });
  } catch (error) {
    console.error("Failed to fetch frequent recipients:", error);
    return NextResponse.json(
      { error: "Failed to fetch frequent recipients" },
      { status: 500 }
    );
  }
}