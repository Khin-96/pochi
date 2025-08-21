// [file name]: route.ts
import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByPhone } from '@/lib/db';

// Helper function to normalize phone numbers
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
      user = await findUserByPhone(normalizedPhone);
      
      // If not found with normalized phone, try the original
      if (!user) {
        user = await findUserByPhone(identifier);
      }
    } else {
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

    // Check if user is trying to send to themselves
    // This check should be done in the frontend, but we'll add it here for security
    const currentUser = await getCurrentUser(); // You'll need to implement this
    if (currentUser && 
        ((type === 'phone' && user.phone === currentUser.phone) || 
         (type === 'email' && user.email === currentUser.email))) {
      return NextResponse.json(
        { 
          verified: false,
          message: 'Cannot send money to yourself'
        },
        { status: 400 }
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