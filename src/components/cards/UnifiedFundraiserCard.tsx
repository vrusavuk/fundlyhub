/**
 * Unified fundraiser card with consistent sizing across the application
 * Standardized dimensions and content areas for perfect grid alignment
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EnhancedButton } from '@/components/enhanced/EnhancedButton';
import { HighlightedTitle, HighlightedDescription, HighlightedLabel } from '@/components/search/HighlightedText';
import { useCategories } from '@/hooks/useCategories';
import { hapticFeedback } from '@/lib/utils/mobile';
import { stripMarkdown } from '@/lib/utils/textUtils';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Share2, 
  BookmarkPlus, 
  MapPin, 
  Clock, 
  Users, 
  Verified,
  TrendingUp,
  Shield,
  Award,
  Zap
} from 'lucide-react';

// Default fallback image for campaigns with broken/missing images
const DEFAULT_CAMPAIGN_IMAGE = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80';

interface UnifiedFundraiserCardProps {
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
  searchQuery?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  trustScore?: number;
  onClick?: () => void;
  onDonate?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onLike?: () => void;
  variant?: 'default' | 'polished';
  status?: string;
  showStatus?: boolean;
}

export function UnifiedFundraiserCard({
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
  isFeatured = false,
  isTrending = false,
  trustScore,
  onClick,
  onDonate,
  onShare,
  onBookmark,
  onLike,
  variant = 'default',
  status,
  showStatus = false,
}: UnifiedFundraiserCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(coverImage || DEFAULT_CAMPAIGN_IMAGE);
  const { categories } = useCategories();
  
  // Clean summary of markdown formatting
  const cleanSummary = stripMarkdown(summary);
  
  const progressPercentage = Math.min((raisedAmount / goalAmount) * 100, 100);
  
  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const getUrgencyConfig = () => {
    switch (urgency) {
      case 'high':
        return {
          color: 'bg-destructive text-destructive-foreground',
          label: 'Urgent',
          icon: <Zap className="h-3 w-3" />
        };
      case 'medium':
        return {
          color: 'bg-warning text-warning-foreground',
          label: 'Limited Time',
          icon: <Clock className="h-3 w-3" />
        };
      case 'low':
        return {
          color: 'bg-success text-success-foreground',
          label: 'Ongoing',
          icon: <TrendingUp className="h-3 w-3" />
        };
      default:
        return null;
    }
  };

  const getCategoryInfo = () => {
    const categoryData = categories.find(c => c.name === category);
    return {
      emoji: categoryData?.emoji || '📋',
      colorClass: categoryData?.color_class || 'bg-muted text-muted-foreground border-border'
    };
  };

  const urgencyConfig = getUrgencyConfig();
  const categoryInfo = getCategoryInfo();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.light();
    
    if (onShare) {
      onShare();
    } else if (navigator.share) {
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
    hapticFeedback.light();
    onBookmark?.();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    hapticFeedback.light();
    onLike?.();
  };

  const handleDonate = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.medium();
    onDonate?.();
  };

  const handleCardClick = () => {
    hapticFeedback.light();
    onClick?.();
  };

  return (
    <Card 
      className={cn(
        // Fixed height and consistent styling
        "group cursor-pointer overflow-hidden transition-colors duration-200 hover:bg-muted/30 border shadow-minimal bg-card",
        // CRITICAL: Fixed minimum height for consistent grid
        "min-h-[480px] flex flex-col",
        isFeatured && "border-primary/30 shadow-standard",
        isTrending && "bg-gradient-to-br from-card to-muted/20"
      )}
      onClick={handleCardClick}
    >
      {/* Image Section - Fixed Height */}
      <div className="relative overflow-hidden flex-shrink-0">
        <div className={cn(
          // CRITICAL: Fixed image height for consistency
          "h-48 bg-muted transition-all duration-700",
          imageLoaded ? "bg-transparent" : "animate-pulse"
        )}>
          <img
            src={imageSrc}
            alt={title}
            className={cn(
              "h-full w-full object-cover",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageSrc(DEFAULT_CAMPAIGN_IMAGE)}
            loading="lazy"
          />
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="secondary"
              className="bg-card/90 hover:bg-card shadow-lg backdrop-blur-sm"
              onClick={handleLike}
            >
              <Heart className={cn(
                "h-4 w-4 transition-colors",
                isLiked ? 'fill-destructive text-destructive' : ''
              )} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-foreground shadow-lg backdrop-blur-sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-foreground shadow-lg backdrop-blur-sm"
              onClick={handleBookmark}
            >
              <BookmarkPlus className={cn(
                "h-4 w-4 transition-colors",
                isBookmarked ? 'fill-primary text-primary' : ''
              )} />
            </Button>
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[calc(100%-6rem)]">
          {showStatus && status && (
            <StatusBadge status={status} showIcon={true} className="shadow-md backdrop-blur-sm" />
          )}
          
          <Badge className={cn(
            "font-semibold shadow-md backdrop-blur-sm border-0 text-xs",
            categoryInfo.colorClass
          )}>
            <span className="mr-1">{categoryInfo.emoji}</span>
            {category}
          </Badge>
          
          {urgencyConfig && (
            <Badge className={cn(
              "font-semibold shadow-md border-0 flex items-center gap-1 text-xs",
              urgencyConfig.color
            )}>
              {urgencyConfig.icon}
              {urgencyConfig.label}
            </Badge>
          )}
          
          {isTrending && (
            <Badge className="bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-md border-0 flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              Trending
            </Badge>
          )}
        </div>

        {/* Top Right Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isVerified && (
            <Badge className="bg-primary text-primary-foreground border-0 flex items-center gap-1 shadow-md text-xs">
              <Verified className="h-3 w-3" />
              Verified
            </Badge>
          )}
          
          {isFeatured && (
            <Badge className="bg-gradient-to-r from-accent to-secondary text-white border-0 flex items-center gap-1 shadow-md text-xs">
              <Award className="h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content Section - Flexible with fixed sections */}
      <CardContent className="px-6 pt-6 pb-4 flex flex-col flex-grow">
        {/* Creator Info - Fixed Height */}
        <div className="flex items-center gap-3 h-12 flex-shrink-0 mb-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xs font-medium">
              {organizationName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <HighlightedLabel
                text={organizationName || 'Anonymous'}
                searchQuery={searchQuery || ''}
                className="text-sm font-semibold text-foreground truncate"
              />
              {isOrganization && (
                <Badge variant="outline" className="text-xs px-1 py-0 font-medium flex-shrink-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Org
                </Badge>
              )}
            </div>
            {location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
          {trustScore && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-muted-foreground">Trust</div>
              <div className="text-sm font-bold text-success">{trustScore}%</div>
            </div>
          )}
        </div>

        {/* Title and Description - Fixed Height */}
        <div className="flex-shrink-0 mb-3">
          {/* Fixed height title area */}
          <div className="h-12 mb-2">
            <HighlightedTitle
              text={title}
              searchQuery={searchQuery || ''}
              className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300"
            />
          </div>
          
          {/* Fixed height description area */}
          <div className="h-10">
            <HighlightedDescription
              text={cleanSummary}
              searchQuery={searchQuery || ''}
              className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
            />
          </div>
        </div>
        
        {/* Progress Section - Fixed Height */}
        <div className="flex-shrink-0 space-y-4 mb-0">
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between items-end">
            <div>
              <p className="font-bold text-lg text-foreground leading-tight">
                {formatAmount(raisedAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                raised of {formatAmount(goalAmount)}
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-sm text-foreground leading-tight">
                {Math.round(progressPercentage)}%
              </p>
              <p className="text-xs text-muted-foreground">funded</p>
            </div>
          </div>
          
          {/* Stats Section - Natural flow without border */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span>{donorCount} supporter{donorCount !== 1 ? 's' : ''}</span>
              </div>
              
              {daysLeft != null && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Campaign ended'}
                  </span>
                </div>
              )}
            </div>
            
            {isTrending && (
              <div className="text-xs font-medium text-accent flex-shrink-0 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Trending
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}