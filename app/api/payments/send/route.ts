// app/api/payments/send/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  findUserById, 
  updateUserBalance, 
  createTransaction, 
  findUserByEmail, 
  findUserByPhone 
} from '@/lib/db';

// Helper function to normalize phone numbers for lookup
const normalizePhoneForLookup = (phone: string): string[] => {
  const digits = phone.replace(/\D/g, '');
  
  // Handle Kenyan phone numbers specifically
  if (digits.startsWith('254')) {
    return [
      digits,                          // 254712345678
      `0${digits.substring(3)}`,       // 0712345678
      `+${digits}`,                    // +254712345678
      `0${digits.substring(3, 6)} ${digits.substring(6)}` // 0712 345678
    ].filter((v, i, a) => a.indexOf(v) === i);
  }

  // For other international numbers
  return [
    `+${digits}`,
    digits,
    digits.replace(/^\+/, '')
  ].filter((v, i, a) => a.indexOf(v) === i);
};

// Helper to validate email format
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(req: Request) {
  try {
    const { 
      recipientIdentifier, 
      amount, 
      description,
      recipientType 
    } = await req.json();
    
    // Validate input
    if (!recipientIdentifier || !amount || !recipientType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided" },
        { status: 400 }
      );
    }

    // Validate recipient type
    if (!['phone', 'email'].includes(recipientType)) {
      return NextResponse.json(
        { error: "Invalid recipient type" },
        { status: 400 }
      );
    }

    // Validate email format if email transfer
    if (recipientType === 'email' && !isValidEmail(recipientIdentifier)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Not authenticated - please login again" },
        { status: 401 }
      );
    }

    // Get sender details
    const sender = await findUserById(user.id);
    if (!sender) {
      return NextResponse.json(
        { error: "Sender account not found" },
        { status: 404 }
      );
    }

    // Check if sender is verified (add this if you have verification)
    // if (!sender.isVerified) {
    //   return NextResponse.json(
    //     { error: "Please verify your account before sending money" },
    //     { status: 403 }
    //   );
    // }

    // Check balance
    if (sender.balance < amountNum) {
      return NextResponse.json(
        { 
          error: "Insufficient balance",
          currentBalance: sender.balance,
          requiredAmount: amountNum
        },
        { status: 400 }
      );
    }

    // Find recipient based on type
    let recipient;
    if (recipientType === "phone") {
      const possiblePhones = normalizePhoneForLookup(recipientIdentifier);
      for (const phone of possiblePhones) {
        recipient = await findUserByPhone(phone);
        if (recipient) break;
      }
    } else {
      // Email transfer
      recipient = await findUserByEmail(recipientIdentifier.toLowerCase().trim());
    }

    if (!recipient) {
      return NextResponse.json(
        { error: `Recipient not found with this ${recipientType}` },
        { status: 404 }
      );
    }

    // Prevent sending to self
    if (recipient._id.toString() === sender._id.toString()) {
      return NextResponse.json(
        { error: "Cannot send money to yourself" },
        { status: 400 }
      );
    }

    // Check if recipient can receive money (add any specific checks here)
    // if (recipient.isSuspended) {
    //   return NextResponse.json(
    //     { error: "Recipient account is suspended" },
    //     { status: 403 }
    //   );
    // }

    // Perform transaction (wrap in transaction if your DB supports it)
    await updateUserBalance(sender._id.toString(), -amountNum);
    await updateUserBalance(recipient._id.toString(), amountNum);

    // Record transaction for sender
    const senderTransaction = await createTransaction({
      userId: sender._id.toString(),
      type: "debit",
      amount: amountNum,
      description: description || `Transfer to ${recipient.name}`,
      counterparty: recipientIdentifier,
      counterpartyName: recipient.name,
      status: "completed",
      date: new Date(),
    });

    // Record transaction for recipient (optional)
    await createTransaction({
      userId: recipient._id.toString(),
      type: "credit",
      amount: amountNum,
      description: description || `Transfer from ${sender.name}`,
      counterparty: sender.phone || sender.email,
      counterpartyName: sender.name,
      status: "completed",
      date: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      message: `Successfully sent ${amountNum} KES to ${recipient.name}`,
      transaction: {
        id: senderTransaction._id.toString(),
        amount: senderTransaction.amount,
        date: senderTransaction.date,
        recipient: {
          name: recipient.name,
          [recipientType]: recipientIdentifier
        },
        receiptUrl: `/api/transactions/${senderTransaction._id}/receipt`
      },
      newBalance: sender.balance - amountNum
    });

  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { 
        error: "Transaction failed",
        message: process.env.NODE_ENV === 'development' 
          ? error instanceof Error 
            ? error.message 
            : String(error)
          : "Please try again later"
      },
      { status: 500 }
    );
  }
}