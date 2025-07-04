import { NextRequest, NextResponse } from 'next/server';
import { updateConversationFeedback, FeedbackData } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, feedback }: { sessionId: string; feedback: FeedbackData } = await request.json();
    
    console.debug('Feedback API called:', { sessionId, feedback });
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    await updateConversationFeedback(sessionId, feedback);
    
    console.debug('Feedback updated successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 