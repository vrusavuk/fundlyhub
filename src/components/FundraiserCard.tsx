import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FundraiserCardProps {
  id: string;
  title: string;
  summary: string;
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  coverImage: string;
  category: string;
  isVerified?: boolean;
  organizationName?: string;
  onClick?: () => void;
}

export function FundraiserCard({
  title,
  summary,
  goalAmount,
  raisedAmount,
  currency,
  coverImage,
  category,
  isVerified = false,
  organizationName,
  onClick,
}: FundraiserCardProps) {
  const progressPercentage = Math.min((raisedAmount / goalAmount) * 100, 100);
  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-smooth hover:shadow-medium hover:-translate-y-1" 
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="h-48 w-full object-cover transition-smooth group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {category}
          </Badge>
          {isVerified && (
            <Badge className="bg-success text-success-foreground">
              ✓ Verified
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {summary}
            </p>
          </div>
          
          {organizationName && (
            <p className="text-sm text-muted-foreground">
              by {organizationName}
            </p>
          )}
          
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-foreground">
                {formatAmount(raisedAmount)} raised
              </span>
              <span className="text-muted-foreground">
                {Math.round(progressPercentage)}% of {formatAmount(goalAmount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}