import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { findUserById, updateUserBalance, createTransaction, findUserByEmail, findUserByPhone } from "@/lib/db";

const normalizePhoneForLookup = (phone: string): string[] => {
  const digits = phone.replace(/\D/g, '');
  return [
    `+${digits}`,
    digits,
    `0${digits.slice(3)}`
  ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
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
      return res.status(404).json({ error: "Sender not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Verify recipient
    let recipient;
    if (recipientType === "phone") {
      const possiblePhones = normalizePhoneForLookup(recipientPhone);
      for (const phone of possiblePhones) {
        recipient = await findUserByPhone(phone);
        if (recipient) break;
      }
    } else {
      recipient = await findUserByEmail(recipientEmail.toLowerCase());
    }

    if (!recipient) {
      return res.status(404).json({ 
        error: recipientType === "phone" 
          ? "Recipient phone not found" 
          : "Recipient email not found"
      });
    }

    // Process transaction
    await updateUserBalance(sender._id.toString(), -amount);
    await updateUserBalance(recipient._id.toString(), amount);

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
    return res.status(500).json({ 
      error: "Transaction failed. Please try again." 
    });
  }
}