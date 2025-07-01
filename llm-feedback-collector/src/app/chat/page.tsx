'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import FeedbackWidget from '@/components/FeedbackWidget';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface FeedbackData {
  [messageIndex: number]: {
    thumbs?: 'up' | 'down';
    rating?: number;
    comment?: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [username, setUsername] = useState('');
  const [sessionId] = useState(() => crypto.randomUUID());
  const [feedback, setFeedback] = useState<FeedbackData>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track user's scroll position to decide whether to auto-scroll (native div)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isAtBottomRef.current = distanceFromBottom < 40;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if user was already near bottom)
  useEffect(() => {
    if (!isAtBottomRef.current) return; // do nothing if user scrolled up

    const scrollToBottom = () => {
      // Primary: use messagesEndRef for smooth scrolling
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

      // Fallback: direct manipulation of container scrollTop
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    scrollToBottom();
  }, [messages, streamingContent]);

  // Auto-focus input on mount and after sending messages
  useEffect(() => {
    if (inputRef.current && !isStreaming) {
      inputRef.current.focus();
    }
  }, [isStreaming]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Save conversation to database whenever messages change
  useEffect(() => {
    if (messages.length > 0 && username.trim()) {
      saveConversationToDb();
    }
  }, [messages, username, sessionId, feedback]);

  const saveConversationToDb = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          username: username.trim(),
          messages,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

      console.log('Conversation saved successfully');
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const handleFeedbackUpdate = (messageIndex: number, feedbackData: any) => {
    setFeedback((prev: FeedbackData) => ({
      ...prev,
      [messageIndex]: feedbackData
    }));
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !username.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    isAtBottomRef.current = true; // assume user wants to stay at bottom after sending
    
    // Maintain focus on input after clearing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                setStreamingContent(prev => prev + data.content);
              } else if (data.type === 'complete') {
                // Add the complete assistant message
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: data.message.content,
                  timestamp: data.timestamp
                };
                
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingContent('');
                setIsStreaming(false);
              } else if (data.type === 'error') {
                // Handle stream error
                console.error('Stream error:', data.error);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: 'Sorry, I encountered an error while processing your request. Please try again.',
                  timestamp: new Date().toISOString()
                }]);
                setStreamingContent('');
                setIsStreaming(false);
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }]);
      }
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
    setFeedback({});
    if (isStreaming) {
      stopGeneration();
    }
    
    // Restore focus after clearing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const MarkdownMessage = ({ content }: { content: string }) => (
    <div className="prose prose-sm max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Customize code blocks
          code: ({children, className, ...props}) => {
            const isInline = !className?.includes('language-');
            if (isInline) {
              return (
                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-800 text-white p-3 rounded-lg overflow-x-auto my-2">
                <code className={className} {...props}>{children}</code>
              </pre>
            );
          },
          // Customize links
          a: ({href, children}) => (
            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Customize tables
          table: ({children}) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({children}) => (
            <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({children}) => (
            <td className="border border-gray-300 px-2 py-1">
              {children}
            </td>
          ),
          // Customize paragraphs for better spacing
          p: ({children}) => (
            <p className="mb-2 last:mb-0">
              {children}
            </p>
          ),
          // Customize headings
          h1: ({children}) => (
            <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({children}) => (
            <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({children}) => (
            <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">
              {children}
            </h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 max-w-5xl">
        <Card className="h-[95vh] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">LLM Chat Interface</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Chat with GPT-4o via OpenRouter using streaming responses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isStreaming ? "default" : "secondary"}>
                  {isStreaming ? "Streaming..." : "Ready"}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearChat}
                  disabled={isStreaming}
                >
                  Clear Chat
                </Button>
              </div>
            </div>
            
            {/* Username input */}
            <div className="mt-4">
              <label className="text-sm font-medium">Username:</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                className="mt-1 max-w-xs"
                disabled={isStreaming}
              />
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !isStreaming && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg">Start a conversation!</p>
                  <p className="text-sm">
                    {!username.trim() 
                      ? "Enter your username above, then type a message to begin chatting with the assistant."
                      : "Type a message below to begin chatting with the assistant."
                    }
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 overflow-hidden ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    {message.timestamp && (
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                    
                    {/* Feedback widget for assistant messages */}
                    {message.role === 'assistant' && (
                      <FeedbackWidget
                        messageIndex={index}
                        sessionId={sessionId}
                        onFeedbackUpdate={handleFeedbackUpdate}
                        initialFeedback={feedback[index]}
                      />
                    )}
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-green-500 text-white text-xs">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Streaming Message */}
              {isStreaming && streamingContent && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[75%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900 overflow-hidden">
                    <MarkdownMessage content={streamingContent} />
                    <div className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Loading indicator when starting */}
              {isStreaming && !streamingContent && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[75%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible div for auto-scrolling */}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            <Separator />

            {/* Input Area */}
            <div className="p-4 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={isStreaming}
                  className="flex-1"
                />
                
                {isStreaming ? (
                  <Button 
                    onClick={stopGeneration}
                    variant="destructive"
                    size="icon"
                  >
                    ⏹
                  </Button>
                ) : (
                  <Button 
                    onClick={sendMessage}
                    disabled={!input.trim() || !username.trim()}
                  >
                    Send
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send • Shift+Enter for new line
                {!username.trim() && " • Enter username to start chatting"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 