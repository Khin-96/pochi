// app/api/support/start-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { startChatContact } from '@/lib/amazon-connect';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, initialMessage } = await request.json();

    const response = await startChatContact(userEmail, userName, initialMessage);
    
    return NextResponse.json({
      contactId: response.ContactId,
      participantToken: response.ParticipantToken,
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    return NextResponse.json(
      { error: 'Failed to start chat' },
      { status: 500 }
    );
  }
}