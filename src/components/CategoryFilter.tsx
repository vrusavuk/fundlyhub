import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/types/fundraiser';
import { Heart, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { useCategoryStats } from '@/hooks/useCategoryStats';
import { formatCurrency } from '@/lib/utils/formatters';

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [navigating, setNavigating] = useState<string | null>(null);
  const { stats: categoryStats, loading } = useCategoryStats();
  const navigate = useNavigate();

  const handleCategoryClick = async (categoryName: string) => {
    setNavigating(categoryName);
    // Navigate to campaigns page with category filter
    navigate(`/campaigns?category=${encodeURIComponent(categoryName)}`);
  };

  const getCategoryStats = (categoryName: string) => {
    const stat = categoryStats[categoryName];
    return {
      count: stat?.count || 0,
      raised: formatCurrency(stat?.raised || 0)
    };
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
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20 relative"
                onClick={() => handleCategoryClick(category.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(category.name);
                  }
                }}
                aria-label={`View ${category.name} campaigns`}
              >
                <CardContent className="p-6">
                  {/* Loading overlay */}
                  {navigating === category.name && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
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
                      <span className="font-medium">
                        {loading ? '...' : stats.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total raised</span>
                      <span className="font-medium text-green-600">
                        {loading ? '...' : stats.raised}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-primary group-hover:text-primary transition-colors">
                      <span>Explore {category.name} Causes</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
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
              <Button 
                size="lg" 
                className="px-8"
                onClick={() => navigate('/create')}
              >
                Create Fundraiser
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}