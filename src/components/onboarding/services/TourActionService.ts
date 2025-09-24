/**
 * Service for handling tour actions
 */
import { TourAction } from '../types';
import { TOUR_CONFIG } from '../config';

export class TourActionService {
  private static instance: TourActionService;
  private searchService?: SearchService;
  private demoService?: DemoService;

  private constructor() {}

  static getInstance(): TourActionService {
    if (!TourActionService.instance) {
      TourActionService.instance = new TourActionService();
    }
    return TourActionService.instance;
  }

  setServices(searchService: SearchService, demoService: DemoService): void {
    this.searchService = searchService;
    this.demoService = demoService;
  }

  async executeAction(action: TourAction): Promise<void> {
    console.log('🎯 TourActionService: Executing action', action.type, action.payload);
    
    switch (action.type) {
      case 'demo-search':
        await this.handleDemoSearch(action.payload?.query as string ?? 'education');
        break;
      case 'navigation':
        await this.handleNavigation(action.payload?.path as string);
        break;
      case 'highlight-section':
        await this.handleHighlightSection(
          action.payload?.section as string,
          action.payload?.scrollTo as boolean
        );
        break;
      case 'navigate-and-scroll':
        await this.handleNavigateAndScroll(
          action.payload?.path as string,
          action.payload?.scrollDemo as boolean
        );
        break;
      case 'custom':
        await this.handleCustomAction(action.payload ?? {});
        break;
      default:
        console.warn('Unknown tour action type:', action.type);
    }
  }

  private async handleDemoSearch(query: string): Promise<void> {
    console.log('🔍 TourActionService: Starting demo search with query:', query);
    
    if (!this.searchService || !this.demoService) {
      console.error('❌ TourActionService: Search or demo service not initialized', {
        searchService: !!this.searchService,
        demoService: !!this.demoService
      });
      return;
    }

    try {
      console.log('✅ TourActionService: Services available, enabling demo mode');
      
      // Enable demo mode first
      this.demoService.setDemoMode(true);
      
      console.log('🚀 TourActionService: Forcing header search to open');
      
      // Force open header search regardless of page
      this.forceOpenHeaderSearch();
      
      // Wait a bit for the search input to appear
      console.log('⏳ TourActionService: Waiting for search input to appear');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Wait for search input to be available
      const searchInput = await this.waitForElement('input[placeholder*="Search"], input[placeholder*="search"]');
      console.log('✅ TourActionService: Search input found, starting typing simulation');
      
      // Simulate typing with proper event handling
      await this.simulateTyping(searchInput, query);
      
      console.log('✅ TourActionService: Demo search completed successfully');
      
    } catch (error) {
      console.error('❌ TourActionService: Failed to execute demo search:', error);
      // Even if demo search fails, continue the tour
    }
  }

  private forceOpenHeaderSearch(): void {
    console.log('🔓 TourActionService: Attempting to force open header search');
    
    // For demo mode, we need to ensure the search opens regardless of page
    try {
      // First try the custom forceOpen method if available
      if (this.searchService && typeof (this.searchService as any).forceOpen === 'function') {
        console.log('🎯 TourActionService: Using custom forceOpen method');
        (this.searchService as any).forceOpen();
      } else {
        // Fallback to standard method
        console.log('🔄 TourActionService: Using standard openHeaderSearch method');
        this.searchService?.openHeaderSearch();
      }
      
      // Also dispatch custom event as additional fallback
      console.log('📡 TourActionService: Dispatching custom event');
      document.dispatchEvent(new CustomEvent('open-header-search'));
      
      // Set demo mode indicator
      document.body.setAttribute('data-onboarding-active', 'true');
      console.log('✅ TourActionService: Demo mode indicator set on body');
      
    } catch (error) {
      console.error('❌ TourActionService: Failed to force open header search:', error);
    }
  }

  private async handleNavigateAndScroll(path: string, scrollDemo: boolean = false): Promise<void> {
    console.log('🌊 TourActionService: Navigate and scroll to:', path);
    
    try {
      // Navigate to the page first
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = path;
        
        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (scrollDemo) {
          // Start slow scrolling demo after page loads
          await this.performScrollDemo();
        }
      }
    } catch (error) {
      console.error('❌ TourActionService: Failed to navigate and scroll:', error);
    }
  }

  private async handleHighlightSection(section: string, scrollTo: boolean = false): Promise<void> {
    console.log('✨ TourActionService: Highlighting section:', section);
    
    try {
      if (scrollTo) {
        await this.scrollToSection(section);
      }
      
      // Add highlight effect to the section
      this.addSectionHighlight(section);
      
    } catch (error) {
      console.error('❌ TourActionService: Failed to highlight section:', error);
    }
  }

  private async scrollToSection(section: string): Promise<void> {
    const selectors = {
      categories: '[data-section="categories"], .categories-section, [class*="categories"]',
      campaigns: '[data-section="campaigns"], .campaigns-section, [class*="campaigns"]',
      hero: '[data-section="hero"], .hero-section, [class*="hero"]'
    };
    
    const selector = selectors[section as keyof typeof selectors] || `[data-section="${section}"]`;
    const element = document.querySelector(selector);
    
    if (element) {
      console.log('📍 TourActionService: Scrolling to section element:', element);
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.warn('⚠️ TourActionService: Section element not found:', selector);
    }
  }

  private addSectionHighlight(section: string): void {
    // Remove existing highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    
    const selectors = {
      categories: '[data-section="categories"], .categories-section, [class*="categories"]',
      campaigns: '[data-section="campaigns"], .campaigns-section, [class*="campaigns"]'
    };
    
    const selector = selectors[section as keyof typeof selectors] || `[data-section="${section}"]`;  
    const element = document.querySelector(selector);
    
    if (element) {
      element.classList.add('onboarding-highlight');
      
      // Add highlight styles if not already present
      if (!document.getElementById('onboarding-highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'onboarding-highlight-styles';
        style.textContent = `
          .onboarding-highlight {
            position: relative !important;
            z-index: 35 !important;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3) !important;
            border-radius: 12px !important;
            transition: all 0.3s ease-in-out !important;
            transform: scale(1.02) !important;
          }
          
          .onboarding-highlight::before {
            content: '';
            position: absolute;
            top: -8px;
            left: -8px;
            right: -8px;
            bottom: -8px;
            background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
            border-radius: 16px;
            z-index: -1;
            animation: pulse-glow 2s ease-in-out infinite;
          }
          
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
          }
        `;
        document.head.appendChild(style);
      }
      
      console.log('✨ TourActionService: Added highlight to section:', element);
      
      // Auto-remove highlight after 10 seconds
      setTimeout(() => {
        element.classList.remove('onboarding-highlight');
      }, 10000);
    }
  }

  private async performScrollDemo(): Promise<void> {
    console.log('🎬 TourActionService: Starting scroll demo');
    
    try {
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = scrollHeight - windowHeight;
      
      // Use config values for scroll demo
      const duration = TOUR_CONFIG.SCROLL_DEMO_DURATION_MS;
      const steps = TOUR_CONFIG.SCROLL_DEMO_STEPS;
      const stepDelay = duration / steps;
      const scrollStep = maxScroll / steps;
      
      for (let i = 0; i <= steps; i++) {
        window.scrollTo({
          top: scrollStep * i,
          behavior: 'smooth'
        });
        
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }
      
      console.log('✅ TourActionService: Scroll demo completed');
      
    } catch (error) {
      console.error('❌ TourActionService: Scroll demo failed:', error);
    }
  }

  private async handleNavigation(path: string): Promise<void> {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = path;
    }
  }

  private async handleCustomAction(payload: Record<string, unknown>): Promise<void> {
    // Implement custom action logic as needed
  }

  private async waitForElement(selector: string, timeout = 5000): Promise<HTMLInputElement> {
    console.log('⏳ TourActionService: Waiting for element:', selector);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector) as HTMLInputElement;
        console.log('🔍 TourActionService: Checking for element...', !!element);
        
        if (element && element.isConnected) {
          console.log('✅ TourActionService: Element found!', element);
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          console.error('❌ TourActionService: Element not found within timeout:', selector);
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
          return;
        }
        
        setTimeout(checkElement, 100);
      };
      
      checkElement();
    });
  }

  private async simulateTyping(input: HTMLInputElement, text: string): Promise<void> {
    if (!input) {
      throw new Error('Search input not found');
    }

    // Focus the input
    input.focus();
    
    // Clear existing value
    input.value = '';
    
    // Clear global search state
    this.searchService?.setSearchQuery('');

    // Dispatch focus event to show dropdown
    input.dispatchEvent(new Event('focus', { bubbles: true }));

    // Type character by character with realistic timing
    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, TOUR_CONFIG.DEMO_TYPING_DELAY_MS));
      
      const currentText = text.substring(0, i);
      
      // Update input value
      input.value = currentText;
      
      // Update global search state
      this.searchService?.setSearchQuery(currentText);
      
      // Trigger input events
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      
      input.dispatchEvent(inputEvent);
      input.dispatchEvent(changeEvent);
      
      // Also trigger React's onChange if it exists
      const reactPropsKey = Object.keys(input).find(key => key.startsWith('__reactProps'));
      if (reactPropsKey) {
        const reactProps = (input as any)[reactPropsKey];
        if (reactProps?.onChange) {
          reactProps.onChange({ target: { value: currentText } });
        }
      }
    }
  }
}

// Interface definitions for dependency injection
export interface SearchService {
  openHeaderSearch(): void;
  setSearchQuery(query: string): void;
  isHeaderSearchOpen?: boolean;
}

export interface DemoService {
  setDemoMode(enabled: boolean): void;
}