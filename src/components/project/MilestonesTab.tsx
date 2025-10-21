import { useState } from 'react';
import { MilestoneCard } from './MilestoneCard';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useProjectMilestones } from '@/hooks/useProjectMilestones';

interface MilestonesTabProps {
  fundraiserId: string;
}

export function MilestonesTab({ fundraiserId }: MilestonesTabProps) {
  const { milestones, isLoading } = useProjectMilestones(fundraiserId);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredMilestones = milestones.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['planned', 'in_progress', 'submitted', 'approved'].includes(m.status);
    if (filter === 'completed') return m.status === 'completed';
    return true;
  });

  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    inProgress: milestones.filter(m => m.status === 'in_progress').length,
    planned: milestones.filter(m => m.status === 'planned').length
  };

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          No milestones have been created for this project yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Milestones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">{stats.planned}</div>
            <div className="text-sm text-muted-foreground">Planned</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.inProgress + stats.planned})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No milestones in this category yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMilestones.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
