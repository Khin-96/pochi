// app/api/payments/verify-recipient/route.ts
import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByPhone } from '@/lib/db';

// Helper function to normalize phone numbers
const normalizePhone = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle Kenyan numbers specifically
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
    const { identifier, type } = await req.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { error: "Missing identifier or type" },
        { status: 400 }
      );
    }

    let user;
    if (type === 'phone') {
      const normalizedPhone = normalizePhone(identifier);
      // Try both normalized and original formats
      user = await findUserByPhone(normalizedPhone) || 
             await findUserByPhone(identifier);
    } else {
      // For email, just use the exact match (case insensitive)
      user = await findUserByEmail(identifier.toLowerCase().trim());
    }

    if (!user) {
      return NextResponse.json(
        { 
          verified: false,
          message: 'Recipient not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verified: true,
      name: user.name,
      type,
      identifier
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}