import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Share2, BookmarkPlus, MapPin, Clock, Users, Verified } from 'lucide-react';
import { highlightSearchMatches } from '@/lib/utils/highlighting';

interface EnhancedFundraiserCardProps {
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
  location?: string;
  donorCount?: number;
  daysLeft?: number;
  urgency?: 'high' | 'medium' | 'low';
  isOrganization?: boolean;
  avatarUrl?: string;
  searchQuery?: string; // New prop for highlighting
  onClick?: () => void;
}

export function EnhancedFundraiserCard({
  id,
  title,
  summary,
  goalAmount,
  raisedAmount,
  currency,
  coverImage,
  category,
  isVerified = false,
  organizationName,
  location,
  donorCount = 0,
  daysLeft,
  urgency,
  isOrganization = false,
  avatarUrl,
  searchQuery,
  onClick,
}: EnhancedFundraiserCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const progressPercentage = Math.min((raisedAmount / goalAmount) * 100, 100);
  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Get highlighted versions of text fields
  const highlightedTitle = searchQuery ? highlightSearchMatches(title, searchQuery) : title;
  const highlightedSummary = searchQuery ? highlightSearchMatches(summary, searchQuery) : summary;
  const highlightedOrganizationName = searchQuery && organizationName 
    ? highlightSearchMatches(organizationName, searchQuery) 
    : organizationName;

  const getUrgencyColor = () => {
    switch (urgency) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      'Medical': 'bg-destructive/10 text-destructive border-destructive/20',
      'Emergency': 'bg-warning/10 text-warning border-warning/20',
      'Education': 'bg-primary/10 text-primary border-primary/20',
      'Community': 'bg-success/10 text-success border-success/20',
      'Animal': 'bg-accent/10 text-accent border-accent/20',
      'Environment': 'bg-success/10 text-success border-success/20',
      'Sports': 'bg-primary/10 text-primary border-primary/20',
      'Arts': 'bg-accent/10 text-accent border-accent/20',
    };
    return colors[category] || 'bg-muted text-muted-foreground border-border';
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: title,
        text: summary,
        url: window.location.href + `/fundraiser/${id}`,
      });
    } else {
      navigator.clipboard.writeText(window.location.href + `/fundraiser/${id}`);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md"
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="h-48 w-full object-cover transition-all duration-500 group-hover:scale-110"
        />
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/90 hover:bg-background"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/90 hover:bg-background"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/90 hover:bg-background"
              onClick={handleBookmark}
            >
              <BookmarkPlus className={`h-4 w-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Category and urgency badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${getCategoryColor()} border font-medium`}>
            {category}
          </Badge>
          {urgency && (
            <Badge className={`${getUrgencyColor()} text-white border-0`}>
              {urgency === 'high' ? '🔥 Urgent' : urgency === 'medium' ? '⏰ Limited Time' : '💚 Stable'}
            </Badge>
          )}
        </div>

        {/* Verification badge */}
        {isVerified && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground border-0 flex items-center gap-1">
              <Verified className="h-3 w-3" />
              Verified
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Creator info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs">
                {organizationName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p 
                  className="text-sm font-medium text-foreground truncate"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightedOrganizationName || 'Anonymous' 
                  }}
                />
                {isOrganization && (
                  <Badge variant="outline" className="text-xs px-1 py-0">Org</Badge>
                )}
              </div>
              {location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {location}
                </div>
              )}
            </div>
          </div>

          {/* Title and description */}
          <div>
            <h3 
              className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors"
              dangerouslySetInnerHTML={{ __html: highlightedTitle }}
            />
            <p 
              className="text-muted-foreground text-sm line-clamp-2"
              dangerouslySetInnerHTML={{ __html: highlightedSummary }}
            />
          </div>
          
          {/* Progress section */}
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex justify-between items-end">
              <div>
                <p className="font-bold text-lg text-foreground">
                  {formatAmount(raisedAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  raised of {formatAmount(goalAmount)}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-sm text-foreground">
                  {Math.round(progressPercentage)}%
                </p>
                <p className="text-xs text-muted-foreground">funded</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{donorCount} {donorCount === 1 ? 'backer' : 'backers'}</span>
              </div>
              
              {daysLeft !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}