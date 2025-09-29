/**
 * Event Versioning Manager
 * Handles event schema evolution and migrations
 */

import { DomainEvent } from './types';

type MigrationFunction = (payload: any) => any;

interface VersionPath {
  from: string;
  to: string;
  migrate: MigrationFunction;
}

export class EventVersionManager {
  private migrations = new Map<string, VersionPath[]>();
  
  /**
   * Register a migration from one version to another
   */
  registerMigration(
    eventType: string, 
    fromVersion: string, 
    toVersion: string,
    migrate: MigrationFunction
  ): void {
    if (!this.migrations.has(eventType)) {
      this.migrations.set(eventType, []);
    }
    
    this.migrations.get(eventType)!.push({
      from: fromVersion,
      to: toVersion,
      migrate,
    });
  }
  
  /**
   * Migrate an event to the target version
   */
  migrateEvent<T extends DomainEvent>(event: T, targetVersion: string): T {
    const migrations = this.migrations.get(event.type);
    if (!migrations || event.version === targetVersion) {
      return event;
    }
    
    // Find migration path
    const path = this.findMigrationPath(event.version, targetVersion, migrations);
    
    if (!path) {
      throw new Error(
        `No migration path found from ${event.version} to ${targetVersion} for ${event.type}`
      );
    }
    
    // Apply migrations in sequence
    let payload = event.payload;
    for (const migration of path) {
      payload = migration.migrate(payload);
    }
    
    return { 
      ...event, 
      version: targetVersion, 
      payload,
      metadata: {
        ...event.metadata,
        originalVersion: event.version,
        migratedAt: Date.now(),
      }
    };
  }
  
  /**
   * Find the shortest migration path using BFS
   */
  private findMigrationPath(
    from: string, 
    to: string, 
    migrations: VersionPath[]
  ): VersionPath[] | null {
    if (from === to) return [];
    
    const queue: { version: string; path: VersionPath[] }[] = [
      { version: from, path: [] }
    ];
    const visited = new Set<string>([from]);
    
    while (queue.length > 0) {
      const { version, path } = queue.shift()!;
      
      // Find all migrations from current version
      for (const migration of migrations) {
        if (migration.from === version && !visited.has(migration.to)) {
          const newPath = [...path, migration];
          
          if (migration.to === to) {
            return newPath;
          }
          
          visited.add(migration.to);
          queue.push({ version: migration.to, path: newPath });
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if a migration path exists
   */
  canMigrate(eventType: string, fromVersion: string, toVersion: string): boolean {
    const migrations = this.migrations.get(eventType);
    if (!migrations) return false;
    
    const path = this.findMigrationPath(fromVersion, toVersion, migrations);
    return path !== null;
  }
  
  /**
   * Get all registered versions for an event type
   */
  getVersions(eventType: string): string[] {
    const migrations = this.migrations.get(eventType);
    if (!migrations) return [];
    
    const versions = new Set<string>();
    for (const migration of migrations) {
      versions.add(migration.from);
      versions.add(migration.to);
    }
    
    return Array.from(versions).sort();
  }
}

// Global instance
export const eventVersionManager = new EventVersionManager();

// Example migrations
eventVersionManager.registerMigration(
  'donation.completed',
  '1.0.0',
  '2.0.0',
  (payload) => ({
    ...payload,
    currency: payload.currency || 'USD', // Add default currency
  })
);

eventVersionManager.registerMigration(
  'user.registered',
  '1.0.0',
  '2.0.0',
  (payload) => ({
    ...payload,
    registrationMethod: payload.registrationMethod || 'email', // Add method
  })
);
