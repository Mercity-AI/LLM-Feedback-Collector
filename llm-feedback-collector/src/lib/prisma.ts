import { PrismaClient } from '@prisma/client';

// Global instance to prevent multiple Prisma clients in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Types for our data structures
export interface MessageData {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FeedbackData {
  [messageIndex: number]: {
    thumbs?: 'up' | 'down';
    rating?: number; // 0-10
    comment?: string;
  };
}

export interface ConversationData {
  sessionId: string;
  username: string;
  messages: MessageData[];
  feedback: FeedbackData;
}

// Database functions
export async function saveConversation(data: ConversationData) {
  try {
    console.log('Saving conversation:', {
      sessionId: data.sessionId,
      username: data.username,
      messageCount: data.messages.length,
      feedbackCount: Object.keys(data.feedback).length
    });
    
    const result = await prisma.conversation.upsert({
      where: { sessionId: data.sessionId },
      update: {
        username: data.username,
        messages: JSON.stringify(data.messages),
        feedback: JSON.stringify(data.feedback),
      },
      create: {
        sessionId: data.sessionId,
        username: data.username,
        messages: JSON.stringify(data.messages),
        feedback: JSON.stringify(data.feedback),
      },
    });
    
    console.log('Conversation saved successfully:', result.id);
    return result;
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
}

export async function updateConversationFeedback(
  sessionId: string,
  newFeedback: FeedbackData
) {
  // First, get the existing conversation to merge feedback
  const existing = await prisma.conversation.findUnique({
    where: { sessionId },
  });
  
  if (!existing) {
    // If conversation doesn't exist, we can't update feedback
    throw new Error('Conversation not found');
  }
  
  // Merge existing feedback with new feedback
  const existingFeedback = JSON.parse(existing.feedback) as FeedbackData;
  const mergedFeedback = { ...existingFeedback, ...newFeedback };
  
  return await prisma.conversation.update({
    where: { sessionId },
    data: {
      feedback: JSON.stringify(mergedFeedback),
    },
  });
}

export async function getConversation(sessionId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { sessionId },
  });

  if (!conversation) {
    return null;
  }

  return {
    id: conversation.id,
    sessionId: conversation.sessionId,
    username: conversation.username,
    messages: JSON.parse(conversation.messages) as MessageData[],
    feedback: JSON.parse(conversation.feedback) as FeedbackData,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
} 