import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { SocialShare } from './SocialShare';
import { RecentDonors } from './RecentDonors';
import type { Fundraiser, Comment, Donation } from '@/types/fundraiser-detail';

interface FundraiserContentProps {
  fundraiser: Fundraiser;
  comments: Comment[];
  donations: Donation[];
  onComment: (content: string) => void;
  commenting: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function FundraiserContent({
  fundraiser,
  comments,
  donations,
  onComment,
  commenting,
}: FundraiserContentProps) {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onComment(newComment);
    setNewComment('');
  };

  return (
    <Tabs defaultValue="story" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
        <TabsTrigger value="story" className="text-sm">Story</TabsTrigger>
        <TabsTrigger value="updates" className="text-sm">Updates</TabsTrigger>
        <TabsTrigger value="comments" className="text-sm">Comments ({comments.length})</TabsTrigger>
      </TabsList>
        
      <TabsContent value="story" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: fundraiser.story_html }}
            />
          </CardContent>
        </Card>

        <SocialShare title={fundraiser.title} slug={fundraiser.slug} />

        {/* Show recent donors in mobile story tab */}
        <div className="lg:hidden">
          <RecentDonors donations={donations} />
        </div>
      </TabsContent>
      
      <TabsContent value="updates" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">No updates yet.</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="comments" className="mt-6">
        <div className="space-y-4">
          {/* Add Comment Form */}
          {user && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Leave a comment of support..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button type="submit" disabled={commenting || !newComment.trim()}>
                    {commenting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          
          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{comment.profiles?.name || 'Anonymous'}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                </CardContent>
              </Card>
            ))}
            
            {comments.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No comments yet. Be the first to show your support!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}