import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get configuration values from environment variables
    const contextMsgLimit = process.env.CONTEXT_MSG_LIMIT 
      ? parseInt(process.env.CONTEXT_MSG_LIMIT, 10) 
      : -1;
    
    const maxMsgSize = process.env.MAX_MSG_SIZE 
      ? parseInt(process.env.MAX_MSG_SIZE, 10) 
      : 1000;

    return NextResponse.json({
      contextMsgLimit,
      maxMsgSize,
      status: 'success'
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch configuration',
        contextMsgLimit: -1,
        maxMsgSize: 1000
      },
      { status: 500 }
    );
  }
} 