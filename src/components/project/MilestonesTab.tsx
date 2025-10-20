import { useState, useEffect } from 'react';
import { MilestoneCard } from './MilestoneCard';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ProjectMilestone } from '@/types/domain/project';

interface MilestonesTabProps {
  fundraiserId: string;
}

// Mock data for demonstration
const mockMilestones: ProjectMilestone[] = [
  {
    id: '1',
    fundraiser_id: 'demo',
    title: 'Phase 1: Community Needs Assessment',
    description: 'Conduct comprehensive survey and interviews with 200+ families to identify critical education gaps and infrastructure needs.',
    target_amount: 15000,
    currency: 'USD',
    due_date: '2025-02-15',
    status: 'completed',
    proof_urls: ['https://example.com/report.pdf', 'https://example.com/photos.zip'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
    created_by: 'user-1'
  },
  {
    id: '2',
    fundraiser_id: 'demo',
    title: 'Phase 2: Build Primary Classroom Wing',
    description: 'Construction of 3 new classrooms with proper ventilation, electricity, and furniture for 90 students.',
    target_amount: 45000,
    currency: 'USD',
    due_date: '2025-05-30',
    status: 'in_progress',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    created_by: 'user-1'
  },
  {
    id: '3',
    fundraiser_id: 'demo',
    title: 'Phase 3: Teacher Training Program',
    description: 'Intensive 6-week training for 12 educators in modern teaching methodologies, technology integration, and student engagement.',
    target_amount: 22000,
    currency: 'USD',
    due_date: '2025-07-15',
    status: 'planned',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    created_by: 'user-1'
  },
  {
    id: '4',
    fundraiser_id: 'demo',
    title: 'Phase 4: Digital Learning Lab Setup',
    description: 'Install computer lab with 25 workstations, projectors, and educational software licenses for STEM learning.',
    target_amount: 35000,
    currency: 'USD',
    due_date: '2025-09-01',
    status: 'planned',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    created_by: 'user-1'
  }
];

export function MilestonesTab({ fundraiserId }: MilestonesTabProps) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMilestones(mockMilestones);
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
