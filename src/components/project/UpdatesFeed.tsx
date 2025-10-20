import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import type { ProjectUpdate } from '@/types/domain/project';

interface UpdatesFeedProps {
  fundraiserId: string;
}

// Mock data
const mockUpdates: ProjectUpdate[] = [
  {
    id: '1',
    fundraiser_id: 'demo',
    author_id: 'user-1',
    title: 'Classroom Construction Reaches 60% Completion! 🏗️',
    body: 'Great progress this month! The foundation is complete and walls are going up. We\'re on track to finish by May 30th. Our contractors have been amazing, working efficiently despite the rainy season. Thank you to all our supporters - your donations are making real change happen!',
    attachments: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800' }
    ],
    visibility: 'public',
    created_at: '2025-01-18T10:30:00Z'
  },
  {
    id: '2',
    fundraiser_id: 'demo',
    milestone_id: '1',
    author_id: 'user-1',
    title: 'Community Needs Assessment Complete ✅',
    body: 'Milestone achieved! After 6 weeks of surveys and interviews, we\'ve gathered insights from 234 families. Key findings: 78% need better early education access, 65% prioritize digital literacy. Full report attached.',
    attachments: [
      { type: 'pdf', url: 'https://example.com/report.pdf' }
    ],
    visibility: 'public',
    created_at: '2025-01-10T14:00:00Z'
  },
  {
    id: '3',
    fundraiser_id: 'demo',
    author_id: 'user-1',
    title: 'Thank You for Helping Us Reach $50K! 🎉',
    body: 'We\'re blown away by your generosity. With $50,000 raised, we\'ve allocated funds to the classroom wing and are planning our teacher training program. Every dollar is going exactly where it\'s needed. Updates coming weekly!',
    attachments: [],
    visibility: 'public',
    created_at: '2025-01-05T09:15:00Z'
  }
];

export function UpdatesFeed({ fundraiserId }: UpdatesFeedProps) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUpdates(mockUpdates);
      setLoading(false);
    }, 500);
  }, [fundraiserId]);

  if (loading) {
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
      {updates.map((update) => (
        <Card key={update.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Avatar>
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=org" />
                  <AvatarFallback>OP</AvatarFallback>
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
                    Posted {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground whitespace-pre-line">{update.body}</p>
            
            {update.attachments && update.attachments.length > 0 && (
              <div className="space-y-3">
                {update.attachments.map((attachment, i) => (
                  <div key={i}>
                    {attachment.type === 'image' ? (
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
                        📄 View {attachment.type.toUpperCase()} document
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
