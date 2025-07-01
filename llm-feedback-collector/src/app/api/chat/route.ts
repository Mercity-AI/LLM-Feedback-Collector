import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
}

// Initialize OpenAI client with OpenRouter configuration
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

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

    // Create streaming chat completion with OpenRouter
    const stream = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: body.messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            
            if (content) {
              fullContent += content;
              
              // Send the content chunk
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
              );
            }
            
            // Check if the stream is done
            if (chunk.choices[0]?.finish_reason === 'stop') {
              // Send completion signal with final message data
              const assistantMessage: Message = {
                role: 'assistant',
                content: fullContent
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
              break;
            }
          }
        } catch (error) {
          console.error('OpenRouter streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Stream processing failed' 
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chat API is ready - OpenRouter Integration',
    provider: 'OpenRouter',
    model: 'openai/gpt-4o',
    supportedMethods: ['POST'],
    schema: {
      messages: [
        { role: 'user', content: 'Your message here' }
      ]
    }
  });
} 