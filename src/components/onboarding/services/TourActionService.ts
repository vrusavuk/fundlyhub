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
      // Enable demo mode
      this.demoService.setDemoMode(true);
      
      // Open search
      this.searchService.openHeaderSearch();
      
      // Wait for search input to be available
      await this.waitForElement('input[placeholder*="Search"], input[placeholder*="search"]');
      
      // Simulate typing
      await this.simulateTyping(query);
      
    } catch (error) {
      console.error('Failed to execute demo search:', error);
    }
  }

  private async handleNavigation(path: string): Promise<void> {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = path;
    }
  }

  private async handleCustomAction(payload: Record<string, unknown>): Promise<void> {
    // Implement custom action logic as needed
    console.log('Custom action executed with payload:', payload);
  }

  private async waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
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

  private async simulateTyping(text: string): Promise<void> {
    const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
    
    if (!searchInput) {
      throw new Error('Search input not found');
    }

    searchInput.focus();
    
    // Clear existing value
    searchInput.value = '';
    this.searchService?.setSearchQuery('');

    // Type character by character
    for (let i = 0; i <= text.length; i++) {
      const currentText = text.substring(0, i);
      
      await new Promise(resolve => setTimeout(resolve, TOUR_CONFIG.DEMO_TYPING_DELAY_MS));
      
      searchInput.value = currentText;
      this.searchService?.setSearchQuery(currentText);
      
      // Trigger input event
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }
}

// Interface definitions for dependency injection
export interface SearchService {
  openHeaderSearch(): void;
  setSearchQuery(query: string): void;
}

export interface DemoService {
  setDemoMode(enabled: boolean): void;
}