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
    switch (action.type) {
      case 'demo-search':
        await this.handleDemoSearch(action.payload?.query as string ?? 'education');
        break;
      case 'navigation':
        await this.handleNavigation(action.payload?.path as string);
        break;
      case 'custom':
        await this.handleCustomAction(action.payload ?? {});
        break;
      default:
        console.warn('Unknown tour action type:', action.type);
    }
  }

  private async handleDemoSearch(query: string): Promise<void> {
    if (!this.searchService || !this.demoService) {
      console.warn('Search or demo service not initialized');
      return;
    }

    try {
      // Enable demo mode first
      this.demoService.setDemoMode(true);
      
      // Force open header search regardless of page
      this.forceOpenHeaderSearch();
      
      // Wait a bit for the search input to appear
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Wait for search input to be available
      const searchInput = await this.waitForElement('input[placeholder*="Search"], input[placeholder*="search"]');
      
      // Simulate typing with proper event handling
      await this.simulateTyping(searchInput, query);
      
    } catch (error) {
      console.error('Failed to execute demo search:', error);
      // Even if demo search fails, continue the tour
    }
  }

  private forceOpenHeaderSearch(): void {
    // For demo mode, we need to ensure the search opens regardless of page
    try {
      // First try the custom forceOpen method if available
      if (this.searchService && typeof (this.searchService as any).forceOpen === 'function') {
        (this.searchService as any).forceOpen();
      } else {
        // Fallback to standard method
        this.searchService?.openHeaderSearch();
      }
      
      // Also dispatch custom event as additional fallback
      document.dispatchEvent(new CustomEvent('open-header-search'));
      
      // Set demo mode indicator
      document.body.setAttribute('data-onboarding-active', 'true');
      
    } catch (error) {
      console.warn('Failed to force open header search:', error);
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
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element && element.isConnected) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
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