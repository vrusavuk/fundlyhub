/**
 * Complete Project Detail Page Example
 * Demonstrates the hybrid approach: extending fundraisers with project features
 */
import { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { CheckCircle, Share2, Bookmark, MapPin, Calendar, Users } from 'lucide-react';
import { MilestonesTab } from '@/components/project/MilestonesTab';
import { ProjectStats } from '@/components/project/ProjectStats';
import { UpdatesFeed } from '@/components/project/UpdatesFeed';
import { ProjectDonationWidget } from '@/components/project/ProjectDonationWidget';
import { useToast } from '@/hooks/use-toast';

// Mock project data
const mockProject = {
  id: 'demo-project-1',
  type: 'project',
  title: 'Rural Education Initiative: Building Hope Through Learning',
  slug: 'rural-education-initiative-uganda',
  summary: 'Providing quality education infrastructure and resources to underserved communities in rural Uganda through a transparent, milestone-based approach.',
  story_html: `
    <h2>Our Mission</h2>
    <p>For the past 3 years, we've witnessed the transformative power of education in rural Uganda. Children walk miles to reach overcrowded schools with minimal resources. We're changing that.</p>
    
    <h3>The Challenge</h3>
    <p>In the Kibaale district, the student-to-teacher ratio exceeds 80:1. Classrooms lack basic infrastructure—proper roofing, ventilation, furniture. Digital literacy is non-existent. Yet these children possess incredible potential.</p>
    
    <h3>Our Solution</h3>
    <p>This project takes a structured, transparent approach:</p>
    <ul>
      <li><strong>Phase 1:</strong> Comprehensive community needs assessment (Completed)</li>
      <li><strong>Phase 2:</strong> Build 3-classroom wing with modern facilities (In Progress)</li>
      <li><strong>Phase 3:</strong> Train 12 educators in modern pedagogy</li>
      <li><strong>Phase 4:</strong> Establish digital learning lab with 25 workstations</li>
    </ul>
    
    <h3>Why This Matters</h3>
    <p>Education is the foundation of economic mobility. Every dollar invested yields measurable outcomes: improved literacy rates, higher enrollment, better health awareness, and economic opportunities.</p>
    
    <h3>Transparency Commitment</h3>
    <p>Every allocation is tracked. Every disbursement documented. Every milestone verified. You'll see exactly how your support creates change.</p>
  `,
  cover_image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200',
  category: 'Education',
  location: 'Kibaale District, Uganda',
  created_at: '2024-11-15T00:00:00Z',
  end_date: '2025-12-31',
  goal_amount: 120000,
  total_raised: 67500,
  donor_count: 342,
  is_verified: true,
  owner: {
    id: 'org-1',
    name: 'Hope Foundation',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hope',
    verified: true
  }
};

const mockMilestones = [
  {
    id: '1',
    fundraiser_id: 'demo-project-1',
    title: 'Phase 1: Community Needs Assessment',
    description: 'Comprehensive survey and interviews',
    target_amount: 15000,
    currency: 'USD',
    due_date: '2025-02-15',
    status: 'completed' as const,
    proof_urls: ['https://example.com/report.pdf'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
    created_by: 'user-1'
  },
  {
    id: '2',
    fundraiser_id: 'demo-project-1',
    title: 'Phase 2: Build Primary Classroom Wing',
    description: 'Construction of 3 classrooms',
    target_amount: 45000,
    currency: 'USD',
    due_date: '2025-05-30',
    status: 'in_progress' as const,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    created_by: 'user-1'
  }
];

export default function ProjectDetailExample() {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleDonate = (amount: number, milestoneId?: string, tip?: number) => {
    toast({
      title: 'Donation Initiated',
      description: `$${amount.toFixed(2)} ${milestoneId ? 'to milestone' : 'to project'}${tip ? ` (+ $${tip.toFixed(2)} tip)` : ''}`,
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied!', description: 'Share this project with others' });
  };

  return (
    <PageContainer maxWidth="2xl">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{mockProject.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Image */}
          <Card className="overflow-hidden">
            <img 
              src={mockProject.cover_image} 
              alt={mockProject.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </Card>

          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{mockProject.category}</Badge>
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified Project
              </Badge>
              <Badge variant="secondary">Structured Milestones</Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">{mockProject.title}</h1>
            
            <p className="text-lg text-muted-foreground">
              {mockProject.summary}
            </p>

            {/* Organizer Info */}
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mockProject.owner.avatar} />
                    <AvatarFallback>HF</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{mockProject.owner.name}</span>
                      {mockProject.owner.verified && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Project Organizer</div>
                  </div>
                </div>
                <Button variant="outline">Follow</Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium">{mockProject.location}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium">Until Dec 2025</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium">{mockProject.donor_count} Supporters</div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons - Mobile */}
            <div className="flex gap-2 lg:hidden">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="story" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="story">Story</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="mt-6">
              <Card>
                <CardContent className="prose prose-sm max-w-none pt-6">
                  <div dangerouslySetInnerHTML={{ __html: mockProject.story_html }} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="milestones" className="mt-6">
              <MilestonesTab fundraiserId={mockProject.id} />
            </TabsContent>

            <TabsContent value="updates" className="mt-6">
              <UpdatesFeed 
                fundraiserId={mockProject.id}
                fundraiserTitle={mockProject.title}
                fundraiserOwnerId={mockProject.owner.id}
                milestones={[]}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Comments feature coming soon
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Stats */}
          <ProjectStats
            totalRaised={mockProject.total_raised}
            goalAmount={mockProject.goal_amount}
            totalAllocated={45000}
            totalDisbursed={15000}
            donorCount={mockProject.donor_count}
          />

          {/* Donation Widget */}
          <ProjectDonationWidget
            milestones={mockMilestones}
            onDonate={handleDonate}
          />

          {/* Action Buttons - Desktop */}
          <div className="hidden lg:flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
