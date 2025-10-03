/**
 * Enhanced fundraiser card with advanced animations and micro-interactions
 */
import React, { useState } from 'react';
import { UnifiedFundraiserCard } from '@/components/cards/UnifiedFundraiserCard';
import { AnimatedCard } from '@/components/animations/AnimatedCard';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';
import type { Fundraiser } from '@/types';

interface AnimatedFundraiserCardProps {
  fundraiser: Fundraiser;
  stats: any;
  searchQuery?: string;
  onCardClick: (slug: string) => void;
  onDonate?: (id: string) => void;
  variant?: 'default' | 'polished';
  delay?: number;
}

export function AnimatedFundraiserCard({
  fundraiser,
  stats,
  searchQuery,
  onCardClick,
  onDonate,
  variant = 'default',
  delay = 0
}: AnimatedFundraiserCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = () => {
    setIsHovered(true);
    hapticFeedback.light();
  };

  const handleCardClick = () => {
    onCardClick(fundraiser.slug);
    hapticFeedback.medium();
  };

  const handleDonate = () => {
    onDonate?.(fundraiser.id);
    hapticFeedback.medium();
  };

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <UnifiedFundraiserCard
        id={fundraiser.id}
        title={fundraiser.title}
        summary={fundraiser.summary || ""}
        goalAmount={fundraiser.goal_amount}
        raisedAmount={stats?.totalRaised || 0}
        currency={fundraiser.currency}
        coverImage={fundraiser.cover_image || "/placeholder.svg"}
        category=""
        organizationName={fundraiser.profiles?.name || "Anonymous"}
        location={fundraiser.location || undefined}
        donorCount={stats?.donorCount || 0}
        daysLeft={stats?.daysLeft}
        urgency={
          stats?.daysLeft && stats.daysLeft <= 7 
            ? 'high' 
            : stats?.daysLeft && stats.daysLeft <= 14 
              ? 'medium' 
              : 'low'
        }
        isVerified={fundraiser.profiles?.name ? true : false}
        isOrganization={fundraiser.org_id ? true : false}
        isFeatured={variant === 'polished'}
        isTrending={variant === 'polished' && (stats?.donorCount > 50)}
        trustScore={variant === 'polished' ? 85 + Math.floor(Math.random() * 15) : undefined}
        searchQuery={searchQuery}
        onClick={handleCardClick}
        onDonate={handleDonate}
        variant={variant}
      />
    </div>
  );
}