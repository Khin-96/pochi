// app/api/payments/verify-recipient/route.ts
import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByPhone } from '@/lib/db';

const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+254${digits.substring(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  return phone;
};

export async function POST(req: Request) {
  try {
    const { identifier, type } = await req.json();
    
    if (!identifier || !type) {
      return NextResponse.json(
        { error: 'Identifier and type are required' },
        { status: 400 }
      );
    }

    let user;
    if (type === 'phone') {
      const normalizedPhone = normalizePhone(identifier);
      user = await findUserByPhone(normalizedPhone);
    } else {
      user = await findUserByEmail(identifier.toLowerCase());
    }

    if (!user) {
      return NextResponse.json(
        { 
          verified: false,
          error: 'Recipient not found' 
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}