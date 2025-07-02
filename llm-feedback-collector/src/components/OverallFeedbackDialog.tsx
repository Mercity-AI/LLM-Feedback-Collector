'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Rating, RatingButton } from '@/components/ui/rating';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// Form validation schema
const feedbackSchema = z.object({
  rating: z.number().min(1, 'Please provide a rating').max(5, 'Rating must be between 1 and 5'),
  thumbs: z.enum(['up', 'down'], {
    required_error: 'Please select your recommendation',
  }),
  comment: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface OverallFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    rating: number;
    thumbs: 'up' | 'down';
    comment: string;
  }) => void;
}

export default function OverallFeedbackDialog({ isOpen, onClose, onSubmit }: OverallFeedbackDialogProps) {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const handleSubmit = (values: FeedbackFormValues) => {
    onSubmit({
      rating: values.rating,
      thumbs: values.thumbs,
      comment: values.comment || '',
    });
    
    // Reset form
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const watchedRating = form.watch('rating');
  const watchedThumbs = form.watch('thumbs');

  const getRatingDescription = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Click to rate your overall experience';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Overall Chat Feedback</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Star Rating using official shadcn Rating component */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Rating
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-1"
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <RatingButton key={i} size={24} />
                        ))}
                      </Rating>
                      <FormDescription className="text-xs">
                        {getRatingDescription(watchedRating)}
                      </FormDescription>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Thumbs Up/Down with proper form field */}
            <FormField
              control={form.control}
              name="thumbs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Would you recommend this chat experience?</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={watchedThumbs === 'up' ? 'default' : 'outline'}
                        onClick={() => field.onChange('up')}
                        className={`flex items-center gap-2 ${
                          watchedThumbs === 'up' 
                            ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white' 
                            : 'hover:bg-green-50 hover:border-green-200'
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={watchedThumbs === 'down' ? 'default' : 'outline'}
                        onClick={() => field.onChange('down')}
                        className={`flex items-center gap-2 ${
                          watchedThumbs === 'down' 
                            ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white' 
                            : 'hover:bg-red-50 hover:border-red-200'
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        No
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Text Feedback */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about your overall experience..."
                      className="min-h-[80px] resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    Share any additional thoughts about your chat experience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!form.formState.isValid || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 