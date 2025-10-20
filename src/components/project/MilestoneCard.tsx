import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileCheck, CheckCircle, Trophy, XCircle, ExternalLink } from 'lucide-react';
import type { ProjectMilestone } from '@/types/domain/project';
import { formatCurrency } from '@/lib/utils/formatters';

interface MilestoneCardProps {
  milestone: ProjectMilestone;
  showActions?: boolean;
  onStatusChange?: (status: string) => void;
}

const statusConfig = {
  planned: { 
    color: 'bg-muted text-muted-foreground', 
    icon: Calendar,
    label: 'Planned' 
  },
  in_progress: { 
    color: 'bg-primary/10 text-primary', 
    icon: Clock,
    label: 'In Progress' 
  },
  submitted: { 
    color: 'bg-accent text-accent-foreground', 
    icon: FileCheck,
    label: 'Submitted' 
  },
  approved: { 
    color: 'bg-success/10 text-success', 
    icon: CheckCircle,
    label: 'Approved' 
  },
  completed: { 
    color: 'bg-success text-success-foreground', 
    icon: Trophy,
    label: 'Completed' 
  },
  canceled: { 
    color: 'bg-destructive/10 text-destructive', 
    icon: XCircle,
    label: 'Canceled' 
  },
};

export function MilestoneCard({ milestone, showActions = false, onStatusChange }: MilestoneCardProps) {
  const config = statusConfig[milestone.status as keyof typeof statusConfig];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg">{milestone.title}</CardTitle>
          <Badge className={config.color}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestone.description && (
          <p className="text-sm text-muted-foreground">
            {milestone.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Target Amount</div>
            <div className="font-semibold text-foreground">
              {formatCurrency(milestone.target_amount, milestone.currency)}
            </div>
          </div>
          
          {milestone.due_date && (
            <div>
              <div className="text-muted-foreground mb-1">Due Date</div>
              <div className="font-semibold text-foreground">
                {new Date(milestone.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>
        
        {milestone.proof_urls && milestone.proof_urls.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-sm font-medium mb-2">Proof of Completion</div>
            <div className="flex flex-wrap gap-2">
              {milestone.proof_urls.map((url, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Document {i + 1}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

        {showActions && onStatusChange && (
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onStatusChange('in_progress')}
            >
              Start
            </Button>
            <Button 
              size="sm"
              onClick={() => onStatusChange('completed')}
            >
              Mark Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
