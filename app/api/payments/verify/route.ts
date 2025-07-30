import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByPhone } from '@/lib/db';

// Helper to normalize Kenyan phone numbers
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
      // Normalize the phone number first
      const normalizedPhone = normalizePhone(identifier);
      
      // Try multiple formats to find the user
      user = await findUserByPhone(normalizedPhone) || 
             await findUserByPhone(normalizedPhone.replace('+', '')) ||
             await findUserByPhone(`0${normalizedPhone.slice(4)}`);
    } else {
      // For emails, do case-insensitive search
      user = await findUserByEmail(identifier.toLowerCase());
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Recipient not found. Please check the details and try again.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: user.name,
      verified: true,
      type,
      identifier
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}