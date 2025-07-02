import { NextRequest, NextResponse } from 'next/server';
import { endChatSession, OverallFeedbackData } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const data: {
      sessionId: string;
      overallFeedback: OverallFeedbackData;
    } = await request.json();
    
    console.log('End chat API called:', {
      sessionId: data.sessionId,
      rating: data.overallFeedback.rating,
      thumbs: data.overallFeedback.thumbs
    });
    
    await endChatSession(data.sessionId, data.overallFeedback);
    
    console.log('Chat session ended successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error ending chat session:', error);
    return NextResponse.json(
      { error: 'Failed to end chat session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 