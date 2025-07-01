import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
}

// Dummy responses for simulation
const dummyResponses = [
  "I understand your question. Let me think about this carefully and provide you with a comprehensive response.",
  "That's an interesting point you've raised. Based on my understanding, I can offer several perspectives on this topic.",
  "Thank you for that question. I'll break this down into key components to give you a thorough answer.",
  "This is a complex topic that deserves a detailed explanation. Let me walk you through the various aspects.",
  "I appreciate you asking about this. Here's what I think based on the information available to me."
];

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    // Validate the request
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Filter out system messages for client (keep only user and assistant)
    const clientMessages = body.messages.filter(msg => msg.role !== 'system');
    
    // Get the last user message
    const lastUserMessage = body.messages
      .filter(msg => msg.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Select a random dummy response
        const responseText = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
        const words = responseText.split(' ');
        
        let wordIndex = 0;
        
        const streamNextWord = () => {
          if (wordIndex < words.length) {
            const word = words[wordIndex];
            const chunk = wordIndex === 0 ? word : ` ${word}`;
            
            // Send the text chunk
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`)
            );
            
            wordIndex++;
            
            // Random delay between 50-200ms to simulate typing
            setTimeout(streamNextWord, Math.random() * 150 + 50);
          } else {
            // Send completion signal with final message data
            const assistantMessage: Message = {
              role: 'assistant',
              content: responseText
            };
            
            const finalData = {
              type: 'complete',
              message: assistantMessage,
              timestamp: new Date().toISOString(),
              messageCount: clientMessages.length + 1
            };
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
            );
            
            controller.close();
          }
        };
        
        // Start streaming after a short delay
        setTimeout(streamNextWord, 100);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chat API is ready',
    supportedMethods: ['POST'],
    schema: {
      messages: [
        { role: 'user', content: 'Your message here' }
      ]
    }
  });
} 