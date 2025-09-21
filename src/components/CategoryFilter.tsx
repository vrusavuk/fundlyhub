import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/types/fundraiser';
import { Heart, Users, TrendingUp } from 'lucide-react';

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryName: string) => {
    // Navigate to category page or apply filter
    window.location.href = `/all-campaigns?category=${encodeURIComponent(categoryName)}`;
  };

  const getCategoryStats = (categoryName: string) => {
    // Mock data - in real app this would come from API
    const stats = {
      'Medical': { count: 1234, raised: '$2.4M' },
      'Emergency': { count: 856, raised: '$1.8M' },
      'Education': { count: 742, raised: '$1.2M' },
      'Community': { count: 523, raised: '$980K' },
      'Animal': { count: 394, raised: '$650K' },
      'Environment': { count: 287, raised: '$420K' },
      'Sports': { count: 195, raised: '$280K' },
      'Arts': { count: 143, raised: '$190K' },
      'Business': { count: 324, raised: '$540K' },
      'Memorial': { count: 167, raised: '$230K' },
      'Charity': { count: 445, raised: '$780K' },
      'Religious': { count: 89, raised: '$120K' },
      'Travel': { count: 134, raised: '$160K' },
      'Technology': { count: 76, raised: '$95K' },
      'Family': { count: 298, raised: '$450K' },
      'Housing': { count: 203, raised: '$310K' },
    };
    return stats[categoryName as keyof typeof stats] || { count: 0, raised: '$0' };
  };

  return (
    <div className="bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Browse Fundraising Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover causes that matter to you. Every category represents thousands of fundraisers 
            making a real difference in communities worldwide.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {CATEGORIES.map((category) => {
            const stats = getCategoryStats(category.name);
            return (
              <Card 
                key={category.name}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{category.emoji}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span>{stats.count}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active campaigns</span>
                      <span className="font-medium">{stats.count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total raised</span>
                      <span className="font-medium text-green-600">{stats.raised}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-sm text-primary group-hover:text-primary-foreground transition-colors">
                      <span>Explore {category.name} Causes</span>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-4">
                Start Your Own Fundraiser
              </h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of people who have successfully raised funds for their causes. 
                It's free to start and our platform makes it easy to reach your goals.
              </p>
              <Button size="lg" className="px-8">
                Create Fundraiser
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}