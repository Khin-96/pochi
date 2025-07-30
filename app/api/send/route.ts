import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { findUserById, updateUserBalance, createTransaction, findUserByEmail, findUserByPhone } from "@/lib/db";

// Helper function to normalize phone numbers for database lookup
const normalizeForLookup = (phone: string): string[] => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Return all possible formats
  return [
    `+${digitsOnly}`,          // +254...
    digitsOnly,                // 254...
    `0${digitsOnly.slice(3)}`  // 0...
  ];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getSession({ req });
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { recipientPhone, recipientEmail, amount, description, recipientType } = req.body;
    const sender = await findUserById(session.user.id);

    if (!sender) {
      return res.status(404).json({ error: "User not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Verify recipient exists
    let recipient;
    if (recipientType === "phone") {
      // Try all possible phone number formats
      const possiblePhones = normalizeForLookup(recipientPhone);
      for (const phone of possiblePhones) {
        recipient = await findUserByPhone(phone);
        if (recipient) break;
      }
    } else {
      recipient = await findUserByEmail(recipientEmail.toLowerCase());
    }

    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Deduct from sender
    await updateUserBalance(sender._id.toString(), -amount);

    // Credit recipient
    await updateUserBalance(recipient._id.toString(), amount);

    // Save transaction
    const transaction = await createTransaction({
      userId: sender._id.toString(),
      type: "send",
      amount,
      description,
      counterparty: recipientType === "phone" ? recipientPhone : recipientEmail,
      counterpartyName: recipient.name,
      status: "completed",
      date: new Date(),
    });

    return res.status(200).json({ 
      message: "Money sent successfully",
      transaction: {
        ...transaction,
        _id: transaction._id.toString()
      }
    });
  } catch (error) {
    console.error("Payment error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}