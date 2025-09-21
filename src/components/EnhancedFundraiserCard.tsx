import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Share2, BookmarkPlus, MapPin, Clock, Users, Verified } from 'lucide-react';

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

  const getUrgencyColor = () => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      'Medical': 'bg-red-50 text-red-700 border-red-200',
      'Emergency': 'bg-orange-50 text-orange-700 border-orange-200',
      'Education': 'bg-blue-50 text-blue-700 border-blue-200',
      'Community': 'bg-green-50 text-green-700 border-green-200',
      'Animal': 'bg-purple-50 text-purple-700 border-purple-200',
      'Environment': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Sports': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Arts': 'bg-pink-50 text-pink-700 border-pink-200',
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
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
              className="bg-white/90 hover:bg-white"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
              onClick={handleBookmark}
            >
              <BookmarkPlus className={`h-4 w-4 ${isBookmarked ? 'fill-blue-500 text-blue-500' : ''}`} />
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
            <Badge className="bg-blue-500 text-white border-0 flex items-center gap-1">
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
                <p className="text-sm font-medium text-foreground truncate">
                  {organizationName || 'Anonymous'}
                </p>
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
            <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {summary}
            </p>
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