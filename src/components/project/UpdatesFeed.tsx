import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { AddUpdateDialog } from './AddUpdateDialog';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';
import type { ProjectMilestone } from '@/types/domain/project';

interface UpdatesFeedProps {
  fundraiserId: string;
  fundraiserTitle: string;
  fundraiserOwnerId: string;
  milestones?: ProjectMilestone[];
}

export function UpdatesFeed({ 
  fundraiserId, 
  fundraiserTitle, 
  fundraiserOwnerId,
  milestones = []
}: UpdatesFeedProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { updates, isLoading } = useProjectUpdates(fundraiserId);
  const { canCreateProjectUpdates } = useFeatureFlags();
  const { user } = useAuth();

  const isOwner = user?.id === fundraiserOwnerId;
  const canPostUpdate = isOwner && canCreateProjectUpdates;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          No updates yet. Check back soon!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {canPostUpdate && (
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Post Update
          </Button>
        </div>
      )}

      {canPostUpdate && user && (
        <AddUpdateDialog
          fundraiserId={fundraiserId}
          fundraiserTitle={fundraiserTitle}
          authorId={user.id}
          milestones={milestones}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}

      {updates.map((update: any) => (
        <Card key={update.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Avatar>
                  <AvatarImage src={update.author?.avatar} />
                  <AvatarFallback>{update.author?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{update.title}</h3>
                    {update.milestone_id && (
                      <Badge variant="outline" className="text-xs">
                        Milestone Update
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">{update.author?.name || 'Anonymous'}</span>
                    {' • '}
                    Posted {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground whitespace-pre-line">{update.body}</p>
            
            {update.attachments && Array.isArray(update.attachments) && update.attachments.length > 0 && (
              <div className="space-y-3">
                {update.attachments.map((attachment: any, i: number) => (
                  <div key={i}>
                    {attachment?.type === 'image' ? (
                      <img 
                        src={attachment.url} 
                        alt="Update attachment"
                        className="rounded-lg w-full max-h-96 object-cover"
                      />
                    ) : (
                      <a 
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        📄 View {attachment?.type?.toUpperCase() || 'FILE'} document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
