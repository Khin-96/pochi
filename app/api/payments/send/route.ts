// app/api/payments/send/route.ts
import { NextResponse } from 'next/server';
import { 
  findUserById, 
  findUserByEmail, 
  findUserByPhone,
  updateUserBalance,
  createTransaction
} from '@/lib/db';
import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';
import { sendMoneySchema } from '@/lib/validation';
import jwt from 'jsonwebtoken';

// Reuse the same phone normalization function
const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.substring(1);
  }
  if (digits.startsWith('+254')) {
    return digits.substring(1);
  }
  return digits;
};

async function getCustomAuthToken(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const tokenCookie = cookies.find(cookie => cookie.startsWith('pochiyangu_token='));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1];
}

export async function POST(req: Request) {
  try {
    // Check authentication via both NextAuth session and custom token
    const session = await getServerSession(authOptions);
    const customToken = await getCustomAuthToken(req);

    let userId: string | undefined;

    if (session?.user?.id) {
      userId = session.user.id;
    } else if (customToken) {
      try {
        const decoded = jwt.verify(customToken, process.env.JWT_SECRET || "your-fallback-secret-for-development");
        userId = (decoded as any).userId;
      } catch (error) {
        console.error("Custom token verification failed:", error);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated - please login again" },
        { status: 401 }
      );
    }

    // Validate input data
    const requestData = await req.json();
    const validation = sendMoneySchema.safeParse(requestData);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          issues: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { 
      recipientType, 
      recipientPhone, 
      recipientEmail, 
      amount, 
      description 
    } = validation.data;

    // Use the authenticated user ID
    const senderId = userId;

    // Get sender details
    const sender = await findUserById(senderId);
    if (!sender) {
      return NextResponse.json(
        { error: "Sender account not found" },
        { status: 404 }
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
    const recipientIdentifier = recipientType === "phone" ? recipientPhone : recipientEmail;
    
    if (recipientType === "phone") {
      const normalizedPhone = normalizePhone(recipientIdentifier);
      // Try both normalized and original formats
      recipient = await findUserByPhone(normalizedPhone) || 
                  await findUserByPhone(recipientIdentifier);
    } else {
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

    // Perform transaction
    const [senderUpdate, recipientUpdate] = await Promise.all([
      updateUserBalance(sender._id.toString(), -amountNum),
      updateUserBalance(recipient._id.toString(), amountNum)
    ]);

    if (!senderUpdate || !recipientUpdate) {
      throw new Error("Failed to update balances");
    }

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

    // Record transaction for recipient
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
      data: {
        transactionId: senderTransaction._id.toString(),
        amount: amountNum,
        recipient: {
          name: recipient.name,
          [recipientType]: recipientIdentifier
        },
        newBalance: sender.balance - amountNum,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Payment processing error:", error);
    
    let errorMessage = "Transaction failed";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("validation")) {
        statusCode = 400;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: statusCode }
    );
  }
}