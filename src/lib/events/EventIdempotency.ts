/**
 * Event Idempotency Manager
 * Ensures events are processed exactly once per processor
 */

export class EventIdempotency {
  private cache: Map<string, { value: string; expires: number }>;
  private readonly ttl: number;
  
  constructor(ttl: number = 86400000) { // 24 hours default
    this.cache = new Map();
    this.ttl = ttl;
    this.startCleanup();
  }
  
  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expires < now) {
          this.cache.delete(key);
        }
      }
    }, 300000); // 5 minutes
  }
  
  async shouldProcess(eventId: string, processorName: string): Promise<boolean> {
    const key = `event:${eventId}:${processorName}`;
    const entry = this.cache.get(key);
    
    if (entry && entry.expires > Date.now()) {
      console.log(`[Idempotency] Skipping duplicate event ${eventId} for ${processorName}`);
      return false;
    }
    
    // Mark as processing
    this.cache.set(key, { 
      value: 'processing', 
      expires: Date.now() + 3600000 // 1 hour
    });
    return true;
  }
  
  async markComplete(eventId: string, processorName: string): Promise<void> {
    const key = `event:${eventId}:${processorName}`;
    this.cache.set(key, { 
      value: 'completed', 
      expires: Date.now() + this.ttl 
    });
  }
  
  async markFailed(eventId: string, processorName: string, error: string): Promise<void> {
    const key = `event:${eventId}:${processorName}`;
    this.cache.set(key, { 
      value: `failed:${error}`, 
      expires: Date.now() + this.ttl 
    });
  }
  
  getStatus(eventId: string, processorName: string): string | null {
    const key = `event:${eventId}:${processorName}`;
    const entry = this.cache.get(key);
    
    if (!entry || entry.expires < Date.now()) {
      return null;
    }
    
    return entry.value;
  }
  
  clearEvent(eventId: string, processorName: string): void {
    const key = `event:${eventId}:${processorName}`;
    this.cache.delete(key);
  }
  
  getStats(): any {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).length,
    };
  }
}

export const eventIdempotency = new EventIdempotency();
