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
import { getCurrentUser } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { sendMoneySchema } from '@/lib/validation';

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

export async function POST(req: Request) {
  try {
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

    // Authenticate sender - use getServerSession for server-side auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated - please login again" },
        { status: 401 }
      );
    }

    const { 
      recipientType, 
      recipientPhone, 
      recipientEmail, 
      amount, 
      description 
    } = validation.data;

    const recipientIdentifier = recipientType === "phone" 
      ? recipientPhone 
      : recipientEmail;

    if (!recipientIdentifier) {
      return NextResponse.json(
        { error: "Recipient identifier is required" },
        { status: 400 }
      );
    }

    // Authenticate sender
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json(
        { error: "Not authenticated - please login again" },
        { status: 401 }
      );
    }

    // Get sender details
    const sender = await findUserById(currentUser.id);
    if (!sender) {
      return NextResponse.json(
        { error: "Sender account not found" },
        { status: 404 }
      );
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum)) {
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