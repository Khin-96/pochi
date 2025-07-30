// pages/api/payments/send.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { getSession } from "next-auth/react" // or your auth system
import { findUserById, updateUserBalance, createTransaction } from "@/lib/db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const session = await getSession({ req })
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const { recipientPhone, amount, description } = req.body
    const sender = await findUserById(session.user.id)

    if (!sender) {
      return res.status(404).json({ error: "User not found" })
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" })
    }

    // Deduct from sender
    await updateUserBalance(sender._id.toString(), -amount)

    // You may want to credit recipient here too...

    // Save transaction
    await createTransaction({
      userId: sender._id.toString(),
      type: "send",
      amount,
      description,
      counterparty: recipientPhone,
      status: "completed",
      date: new Date(),
    })

    return res.status(200).json({ message: "Money sent successfully" })
  } catch (error) {
    console.error("Payment error:", error)
    return res.status(500).json({ error: "Server error" })
  }
}
