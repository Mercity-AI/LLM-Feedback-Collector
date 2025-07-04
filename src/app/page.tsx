'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import FeedbackWidget from '@/components/FeedbackWidget';
import OverallFeedbackDialog from '@/components/OverallFeedbackDialog';
import ModelSelector from '@/components/ModelSelector';
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
  const [sessionId, setSessionId] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackData>({});
  const [showOverallFeedbackDialog, setShowOverallFeedbackDialog] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o');
  const [contextMsgLimit, setContextMsgLimit] = useState<number>(-1);
  const [maxMsgSize, setMaxMsgSize] = useState<number>(1000);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate session ID on client side only to avoid hydration mismatch
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Load username from localStorage on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('llm-feedback-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Auto-expand settings on mobile when username is empty
  useEffect(() => {
    if (!username.trim()) {
      setIsControlsExpanded(true);
    }
  }, [username]);

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem('llm-feedback-username', username);
    }
  }, [username]);

  // Fetch configuration limits from backend
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          setContextMsgLimit(config.contextMsgLimit || -1);
          setMaxMsgSize(config.maxMsgSize || 1000);
        }
      } catch (error) {
        console.error('Failed to fetch config limits:', error);
      }
    };
    fetchLimits();
  }, []);

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

  const saveConversationToDb = useCallback(async () => {
    if (!sessionId) {
      console.debug('Session ID not ready, skipping save');
      return;
    }
    
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

      console.debug('Conversation saved successfully');
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [sessionId, username, messages, feedback]);

  // Save conversation to database whenever messages change
  useEffect(() => {
    if (messages.length > 0 && username.trim() && sessionId) {
      saveConversationToDb();
    }
  }, [messages, username, sessionId, saveConversationToDb]);

  const handleFeedbackUpdate = (messageIndex: number, feedbackData: { thumbs?: 'up' | 'down'; rating?: number; comment?: string }) => {
    setFeedback((prev: FeedbackData) => ({
      ...prev,
      [messageIndex]: feedbackData
    }));
  };

  const handleEndChat = () => {
    if (messages.length === 0) {
      alert('No conversation to end!');
      return;
    }
    setShowOverallFeedbackDialog(true);
  };

  const handleOverallFeedbackSubmit = async (overallFeedback: {
    rating: number;
    thumbs: 'up' | 'down';
    comment: string;
  }) => {
    if (!sessionId) {
      alert('Session not ready. Please wait and try again.');
      return;
    }
    
    try {
      const response = await fetch('/api/end-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          overallFeedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit overall feedback');
      }

      setIsChatEnded(true);
      setShowOverallFeedbackDialog(false);
      console.debug('Overall feedback submitted successfully');
      
      // Show thank you message
      alert('Thank you for your feedback! Your chat session has been completed.');
    } catch (error) {
      console.error('Error submitting overall feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (isSendDisabled) return;

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
          messages: [...messages, userMessage],
          model: selectedModel
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
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
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
    setIsChatEnded(false);
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

  // Helper function to count words in a message
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Check if message size exceeds limit
  const isMessageTooLong = (): boolean => {
    if (maxMsgSize <= 0) return false;
    return countWords(input) > maxMsgSize;
  };

  // Check if context message limit is reached
  const isContextLimitReached = (): boolean => {
    if (contextMsgLimit <= 0) return false;
    return messages.length >= contextMsgLimit;
  };

  // Get current word count
  const currentWordCount = countWords(input);
  
  // Check if send should be disabled
  const isSendDisabled = !input.trim() || !username.trim() || isChatEnded || isStreaming || isMessageTooLong() || isContextLimitReached();

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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl lg:text-2xl">LLM Chat Interface</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Chat with multiple LLM models via OpenRouter using streaming responses
                </p>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-2">
                <div className="flex items-center gap-4">
                  {/* Model selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">Model:</label>
                    <ModelSelector 
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      disabled={isStreaming || isChatEnded}
                    />
                  </div>
                  {/* Username input in header */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">Username:</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username..."
                      className={`w-48 ${!username.trim() ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      disabled={isStreaming || isChatEnded}
                    />
                  </div>
                  {isStreaming && (
                    <Badge variant="default">
                      Streaming...
                    </Badge>
                  )}
                  {isChatEnded && (
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      Chat Completed
                    </Badge>
                  )}
                </div>
                                 <div className="text-xs text-gray-500 font-mono break-all">
                   Session ID: {sessionId || 'Loading...'}
                 </div>
              </div>
              
              {/* Mobile Layout */}
              <div className="lg:hidden w-full min-w-0">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Settings
                    <svg 
                      className={`w-4 h-4 transition-transform ${isControlsExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    {isStreaming && (
                      <Badge variant="default">
                        Streaming...
                      </Badge>
                    )}
                    {isChatEnded && (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        Chat Completed
                      </Badge>
                    )}
                  </div>
                </div>
                
                                 {isControlsExpanded && (
                   <div className="mt-3 space-y-3 px-1">
                     {/* Model selector */}
                     <div className="flex items-center gap-3">
                       <label className="text-sm font-medium whitespace-nowrap w-20 shrink-0">Model:</label>
                       <div className="flex-1 min-w-0">
                         <ModelSelector 
                           selectedModel={selectedModel}
                           onModelChange={setSelectedModel}
                           disabled={isStreaming || isChatEnded}
                         />
                       </div>
                     </div>
                     {/* Username input */}
                     <div className="flex items-center gap-3">
                       <label className="text-sm font-medium whitespace-nowrap w-20 shrink-0">Username:</label>
                       <Input
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         placeholder="Enter your username..."
                         className={`flex-1 min-w-0 ${!username.trim() ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                         disabled={isStreaming || isChatEnded}
                       />
                     </div>
                   </div>
                 )}
                
                                 {/* Session ID - left aligned */}
                 <div className="text-xs text-gray-500 font-mono mt-2 break-all">
                   <span className="block sm:inline">Session ID: </span>
                   <span className="block sm:inline">{sessionId || 'Loading...'}</span>
                 </div>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
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
                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 sm:px-4 sm:py-2 overflow-hidden ${
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
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-900 overflow-hidden">
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
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-900">
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
            <div className="p-2 sm:p-4 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isChatEnded ? "Chat has ended" : "Type your message here..."}
                  disabled={isStreaming || isChatEnded}
                  className="flex-1 text-sm sm:text-base"
                />
                
                {isStreaming ? (
                  <Button 
                    onClick={stopGeneration}
                    variant="destructive"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    ⏹
                  </Button>
                ) : (
                  <Button 
                    onClick={sendMessage}
                    disabled={isSendDisabled}
                    className="flex-shrink-0 text-sm sm:text-base"
                  >
                    Send
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {isChatEnded ? (
                      "Chat session completed"
                    ) : (
                      <>
                        Press Enter to send • Shift+Enter for new line
                        {!username.trim() && " • Enter username to start chatting"}
                      </>
                    )}
                  </p>
                  
                  {/* Warning messages */}
                  {!isChatEnded && (
                    <div className="mt-1 space-y-1">
                      {isMessageTooLong() && (
                        <p className="text-xs text-red-500">
                          Message too long ({currentWordCount}/{maxMsgSize} words)
                        </p>
                      )}
                      {isContextLimitReached() && (
                        <p className="text-xs text-red-500">
                          Message limit reached ({messages.length}/{contextMsgLimit} messages)
                        </p>
                      )}
                      {!isMessageTooLong() && !isContextLimitReached() && maxMsgSize > 0 && (
                        <p className="text-xs text-gray-400">
                          {currentWordCount}/{maxMsgSize} words
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {!isChatEnded && messages.length > 0 && (
                  <Button 
                    onClick={handleEndChat}
                    variant="outline"
                    size="sm"
                    disabled={isStreaming}
                    className="text-xs flex-shrink-0"
                  >
                    End Chat
                  </Button>
                )}
                
                {isChatEnded && (
                  <Button 
                    onClick={clearChat}
                    variant="default"
                    size="sm"
                    className="text-xs"
                  >
                    New Chat
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Overall Feedback Dialog */}
      <OverallFeedbackDialog
        isOpen={showOverallFeedbackDialog}
        onClose={() => setShowOverallFeedbackDialog(false)}
        onSubmit={handleOverallFeedbackSubmit}
      />
    </div>
  );
} 