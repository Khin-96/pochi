import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByPhone } from '@/lib/db';

export async function POST(req: Request) {
  const { identifier, type } = await req.json();

  try {
    // Validate input
    if (!identifier || !type) {
      return NextResponse.json(
        { error: 'Identifier and type are required' },
        { status: 400 }
      );
    }

    let user;
    if (type === 'phone') {
      user = await findUserByPhone(identifier);
    } else {
      user = await findUserByEmail(identifier);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Recipient not found' }, 
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}