import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * Design System Showcase Component
 * Demonstrates the enhanced design system tokens and patterns
 */
export function DesignSystemShowcase() {
  return (
    <div className="section-hierarchy p-8 bg-background">
      <div className="content-hierarchy max-w-6xl mx-auto">
        <h1 className="heading-display mb-4">Design System Showcase</h1>
        <p className="body-large text-muted-foreground mb-12">
          Enhanced design system with semantic tokens, consistent spacing, and beautiful interactions
        </p>

        {/* Typography */}
        <div className="component-hierarchy mb-12">
          <h2 className="heading-large mb-6">Typography Hierarchy</h2>
          <div className="space-y-4">
            <h3 className="heading-display">Display Heading</h3>
            <h3 className="heading-large">Large Heading</h3>
            <h4 className="heading-medium">Medium Heading</h4>
            <h5 className="heading-small">Small Heading</h5>
            <p className="body-large">Large body text with relaxed leading for better readability.</p>
            <p className="body-medium">Medium body text for standard content and descriptions.</p>
            <p className="caption-medium">Medium caption text for labels and metadata.</p>
            <p className="label-small">SMALL LABEL TEXT FOR FORM ELEMENTS</p>
          </div>
        </div>

        {/* Cards */}
        <div className="component-hierarchy mb-12">
          <h2 className="heading-large mb-6">Enhanced Cards</h2>
          <div className="mobile-grid grid-cols-1 md:grid-cols-3">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="caption-medium">Standard Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-medium text-muted-foreground">
                  Enhanced with subtle shadows and smooth hover transitions.
                </p>
              </CardContent>
            </Card>

            <Card className="card-enhanced card-featured">
              <CardHeader>
                <CardTitle className="caption-medium">Featured Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-medium text-muted-foreground">
                  Featured styling with primary ring and glow effect.
                </p>
              </CardContent>
            </Card>

            <Card className="card-enhanced hover-scale">
              <CardHeader>
                <CardTitle className="caption-medium">Interactive Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-medium text-muted-foreground">
                  Hover to see scale animation and enhanced shadows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Buttons */}
        <div className="component-hierarchy mb-12">
          <h2 className="heading-large mb-6">Enhanced Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button className="cta-primary">Primary CTA</Button>
            <Button className="cta-secondary">Secondary CTA</Button>
            <Button variant="outline" className="shadow-soft">Outlined</Button>
            <Button variant="ghost" className="hover-scale">Hover Scale</Button>
          </div>
        </div>

        {/* Badges */}
        <div className="component-hierarchy mb-12">
          <h2 className="heading-large mb-6">Status Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default" className="shadow-soft">Active</Badge>
            <Badge variant="secondary" className="shadow-soft">Pending</Badge>
            <Badge variant="destructive" className="shadow-soft">Suspended</Badge>
            <Badge variant="outline" className="shadow-soft">Draft</Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="component-hierarchy mb-12">
          <h2 className="heading-large mb-6">Enhanced Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between body-medium mb-2">
                <span>Standard Progress</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="progress-enhanced" />
            </div>
            <div>
              <div className="flex justify-between body-medium mb-2">
                <span>With Gradient</span>
                <span>60%</span>
              </div>
              <div className="progress-enhanced bg-muted rounded-full overflow-hidden">
                <div 
                  className="progress-indicator h-3" 
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="component-hierarchy mb-12">
          <h2 className="heading-large mb-6">Spacing System</h2>
          <div className="space-y-6">
            <div className="mobile-container bg-muted/30 rounded-lg">
              <p className="body-medium">Mobile Container Spacing</p>
            </div>
            <div className="mobile-card-spacing bg-muted/30 rounded-lg">
              <p className="body-medium">Mobile Card Spacing</p>
            </div>
            <div className="mobile-header-spacing bg-muted/30 rounded-lg">
              <p className="body-medium">Mobile Header Spacing</p>
            </div>
          </div>
        </div>

        {/* Effects */}
        <div className="component-hierarchy">
          <h2 className="heading-large mb-6">Visual Effects</h2>
          <div className="mobile-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 rounded-lg shadow-soft bg-card">
              <p className="caption-medium">Soft Shadow</p>
            </div>
            <div className="p-6 rounded-lg shadow-medium bg-card">
              <p className="caption-medium">Medium Shadow</p>
            </div>
            <div className="p-6 rounded-lg shadow-hard bg-card">
              <p className="caption-medium">Hard Shadow</p>
            </div>
            <div className="p-6 rounded-lg shadow-glow bg-card">
              <p className="caption-medium">Glow Shadow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}