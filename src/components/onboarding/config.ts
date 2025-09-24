/**
 * Onboarding tour configuration
 */
import { TourStep } from './types';
import { 
  Sparkles,
  Search,
  Heart,
  Eye,
  Users,
  CheckCircle
} from 'lucide-react';

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FundlyGive! 🎉',
    description: 'Let\'s take a quick tour to help you discover amazing fundraising campaigns and learn how to make a difference.',
    icon: Sparkles,
    config: {
      showBackdrop: true,
      backdropOpacity: 0.4,
      allowBackgroundInteraction: false
    }
  },
  {
    id: 'search',
    title: 'Smart Search Experience',
    description: 'Our intelligent search helps you find campaigns by cause, location, or keywords. Try our demo search to see how it works!',
    icon: Search,
    action: {
      text: 'Try Demo Search',
      type: 'demo-search',
      payload: { query: 'education' }
    },
    config: {
      showBackdrop: true,
      backdropOpacity: 0.2,
      allowBackgroundInteraction: true
    }
  },
  {
    id: 'categories',
    title: 'Browse Categories',
    description: 'Explore campaigns by category to find causes you care about. Each category shows live statistics and trending causes.',
    icon: Heart,
    config: {
      showBackdrop: true,
      backdropOpacity: 0.3,
      allowBackgroundInteraction: false
    }
  },
  {
    id: 'campaigns',
    title: 'Discover Campaigns',
    description: 'View campaign cards with progress, goals, and impact. Click any card to learn more and donate.',
    icon: Eye,
    config: {
      showBackdrop: true,
      backdropOpacity: 0.3,
      allowBackgroundInteraction: false
    }
  },
  {
    id: 'community',
    title: 'Join the Community',
    description: 'Follow creators, bookmark campaigns, and see the impact you\'re making with other supporters.',
    icon: Users,
    config: {
      showBackdrop: true,
      backdropOpacity: 0.3,
      allowBackgroundInteraction: false
    }
  },
  {
    id: 'complete',
    title: 'You\'re All Set! ✨',
    description: 'You\'re ready to explore and support amazing causes. Happy giving!',
    icon: CheckCircle,
    config: {
      showBackdrop: true,
      backdropOpacity: 0.4,
      allowBackgroundInteraction: false
    }
  }
] as const;

export const TOUR_CONFIG = {
  NAVIGATION_DEBOUNCE_MS: 300,
  AUTO_PROGRESS_DELAY_MS: 2000,
  DEMO_TYPING_DELAY_MS: 150,
  DEMO_SEARCH_DELAY_MS: 500
} as const;