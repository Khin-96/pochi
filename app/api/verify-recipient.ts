import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { findUserByEmail, findUserByPhone } from "@/lib/db";

const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('254') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+254${digits.substring(1)}`;
  }
  if (digits.length === 9 && /^[17]\d{8}$/.test(digits)) {
    return `+254${digits}`;
  }
  return phone;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { identifier, type } = req.body;
    
    if (!identifier || !type) {
      return res.status(400).json({ error: "Identifier and type are required" });
    }

    let user;
    if (type === "phone") {
      const normalizedPhone = normalizePhone(identifier);
      user = await findUserByPhone(normalizedPhone);
    } else {
      user = await findUserByEmail(identifier.toLowerCase());
    }

    if (!user) {
      return res.status(404).json({ 
        verified: false,
        error: "Recipient not found. Please check the details and try again."
      });
    }

    return res.status(200).json({
      name: user.name,
      verified: true,
      type,
      identifier
    });

  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ 
      verified: false,
      error: "Internal server error during verification" 
    });
  }
}