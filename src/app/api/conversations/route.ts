import { NextRequest, NextResponse } from 'next/server';
import { saveConversation, getConversation, ConversationData } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const data: ConversationData = await request.json();
    
    console.debug('Conversations API called:', {
      sessionId: data.sessionId,
      username: data.username,
      messageCount: data.messages.length
    });
    
    await saveConversation(data);
    
    console.debug('Conversation API saved successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error saving conversation:', error);
    return NextResponse.json(
      { error: 'Failed to save conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const conversation = await getConversation(sessionId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation' },
      { status: 500 }
    );
  }
} 