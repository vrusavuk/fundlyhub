import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { DisplayHeading, Heading, Text, Caption } from '@/components/ui/typography';

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [navigating, setNavigating] = useState<string | null>(null);
  const { stats: categoryStats, loading, error, refresh } = useCategories();
  const navigate = useNavigate();

  const handleCategoryClick = async (categoryName: string) => {
    setNavigating(categoryName);
    // Navigate to campaigns page with category filter
    navigate(`/campaigns?category=${encodeURIComponent(categoryName)}`);
  };


  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingState variant="cards" count={6} />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <ErrorMessage 
            message={error} 
            onRetry={refresh}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background via-muted/20 to-background" data-section="categories" data-category-filter>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <DisplayHeading level="md" as="h2" className="mb-4">
            Browse Fundraising Categories
          </DisplayHeading>
          <Text size="lg" emphasis="low" className="max-w-2xl mx-auto">
            Discover campaigns across different causes and make a difference in the areas you care about most
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {categoryStats.map((category) => {
            return (
              <Card 
                key={category.category_id}
                className="group cursor-pointer transition-colors duration-200 hover:bg-muted/50 border hover:border-muted-foreground/20 relative"
                onClick={() => handleCategoryClick(category.category_name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(category.category_name);
                  }
                }}
                aria-label={`View ${category.category_name} campaigns`}
              >
                <CardContent className="p-6">
                  {/* Loading overlay */}
                  {navigating === category.category_name && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{category.emoji}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>{category.campaign_count || 0}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Heading level="lg" as="h3" className="mb-2">{category.category_name}</Heading>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <Caption size="sm" as="span" className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Active Campaigns
                        </Caption>
                        <span className="font-medium text-foreground">{category.active_campaigns || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Caption size="sm" as="span" className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Closed Campaigns
                        </Caption>
                        <span className="font-medium text-foreground">{category.closed_campaigns || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Caption size="sm" as="span" className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          Total Raised
                        </Caption>
                        <span className="font-medium text-foreground">
                          {MoneyMath.format(MoneyMath.create(category.total_raised || 0, 'USD'))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-primary group-hover:text-primary transition-colors">
                      <span>Explore {category.category_name} Causes</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <Heading level="xl" as="h3" className="mb-4">
                Start Your Own Fundraiser
              </Heading>
              <Text size="md" emphasis="low" className="mb-6">
                Join thousands of people who have successfully raised funds for their causes. 
                It's free to start and our platform makes it easy to reach your goals.
              </Text>
              <Button 
                variant="accent"
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
    </section>
  );
}