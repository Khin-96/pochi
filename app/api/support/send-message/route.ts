// app/api/support/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SendMessageCommand } from '@aws-sdk/client-connectparticipant';

export async function POST(request: NextRequest) {
  try {
    const { message, contactId, participantToken } = await request.json();

    // In a real implementation, you'd use the participant token
    // to send messages through the WebSocket connection
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}