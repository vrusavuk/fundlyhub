import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, TrendingUp, MapPin } from 'lucide-react';

interface TrustIndicator {
  icon: React.ReactNode;
  text: string;
  value: string;
}

const trustIndicators: TrustIndicator[] = [
  {
    icon: <TrendingUp className="h-5 w-5 text-status-success" />,
    text: "Total Raised",
    value: "$2.5M+"
  },
  {
    icon: <Clock className="h-5 w-5 text-status-info" />,
    text: "Active Campaigns",
    value: "500+"
  },
  {
    icon: <MapPin className="h-5 w-5 text-primary" />,
    text: "Countries Served",
    value: "50+"
  }
];

export function TrustBadges() {
  return (
    <div className="bg-secondary/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Badge className="bg-status-success-light text-status-success border-status-success-border px-4 py-2">
            <span className="flex items-center gap-2">
              🛡️ Trusted Platform
            </span>
          </Badge>
          <h2 className="mt-4 text-2xl font-bold">
            Join thousands of successful fundraisers
          </h2>
          <p className="mt-2 text-muted-foreground">
            Our platform has helped raise millions for causes that matter
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustIndicators.map((indicator, index) => (
            <Card key={index} className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  {indicator.icon}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {indicator.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {indicator.text}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-status-success rounded-full"></div>
              <span className="text-sm text-muted-foreground">Bank-level security</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-status-info rounded-full"></div>
              <span className="text-sm text-muted-foreground">0% platform fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-muted-foreground">24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}