'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FeedbackWidgetProps {
  messageIndex: number;
  sessionId: string;
  onFeedbackUpdate: (messageIndex: number, feedback: {
    thumbs?: 'up' | 'down';
    rating?: number;
    comment?: string;
  }) => void;
  initialFeedback?: {
    thumbs?: 'up' | 'down';
    rating?: number;
    comment?: string;
  };
}

export default function FeedbackWidget({
  messageIndex,
  sessionId,
  onFeedbackUpdate,
  initialFeedback
}: FeedbackWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [thumbs, setThumbs] = useState<'up' | 'down' | undefined>(initialFeedback?.thumbs);
  const [rating, setRating] = useState<number>(initialFeedback?.rating ?? 5);
  const [comment, setComment] = useState<string>(initialFeedback?.comment ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when initialFeedback changes
  useEffect(() => {
    setThumbs(initialFeedback?.thumbs);
    setRating(initialFeedback?.rating ?? 5);
    setComment(initialFeedback?.comment ?? '');
  }, [initialFeedback]);

  const handleThumbsClick = async (value: 'up' | 'down') => {
    const newThumbs = thumbs === value ? undefined : value;
    setThumbs(newThumbs);
    
    const feedback = {
      thumbs: newThumbs,
      rating: rating,
      comment: comment.trim() || undefined
    };

    onFeedbackUpdate(messageIndex, feedback);
    await saveFeedback(feedback);
  };

  const handleRatingChange = async (value: number) => {
    setRating(value);
    
    const feedback = {
      thumbs: thumbs,
      rating: value,
      comment: comment.trim() || undefined
    };

    onFeedbackUpdate(messageIndex, feedback);
    await saveFeedback(feedback);
  };

  const handleCommentSubmit = async () => {
    const feedback = {
      thumbs: thumbs,
      rating: rating,
      comment: comment.trim() || undefined
    };

    onFeedbackUpdate(messageIndex, feedback);
    await saveFeedback(feedback);
  };

  const saveFeedback = async (feedback: { thumbs?: 'up' | 'down'; rating?: number; comment?: string }) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          feedback: { [messageIndex]: feedback }
        }),
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2 pt-2">
      <div className="flex items-center gap-2 text-sm">
        {/* Thumbs up/down */}
        <Button
          variant={thumbs === 'up' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleThumbsClick('up')}
          disabled={isSubmitting}
          className="h-6 w-6 p-0"
        >
          👍
        </Button>
        <Button
          variant={thumbs === 'down' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleThumbsClick('down')}
          disabled={isSubmitting}
          className="h-6 w-6 p-0"
        >
          👎
        </Button>

        <Separator orientation="vertical" className="h-4" />

        {/* More feedback button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs px-2 h-6"
        >
          {isExpanded ? 'Less' : 'More feedback'}
        </Button>
      </div>

      {/* Expanded feedback options */}
      {isExpanded && (
        <Card className="mt-2 p-3 bg-gray-50">
          <CardContent className="space-y-3 p-0">
            {/* Rating slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Rating: {rating}/10
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={rating}
                onChange={(e) => handleRatingChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isSubmitting}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Comment box */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Additional feedback (optional)
              </label>
              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="flex-1 text-sm"
                  disabled={isSubmitting}
                />
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 