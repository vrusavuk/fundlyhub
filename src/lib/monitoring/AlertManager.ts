/**
 * Alert Management System
 * Monitors logs and triggers alerts based on configurable rules
 */

import { logger } from '@/lib/services/logger.service';
import { LogLevel } from './StructuredLogger';

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  threshold: number;
  timeWindowMs: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  actions: AlertAction[];
}

export interface AlertCondition {
  type: 'error_rate' | 'response_time' | 'memory_usage' | 'custom_metric';
  metric?: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
}

export interface AlertAction {
  type: 'log' | 'email' | 'webhook' | 'toast';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertRule['severity'];
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class AlertManagerService {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private readonly maxAlerts = 100;
  private alertCounters: Map<string, { count: number; windowStart: number }> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info('Alert rule registered', {
      componentName: 'AlertManager',
      operationName: 'registerRule',
      metadata: { ruleId: rule.id, ruleName: rule.name, severity: rule.severity },
    });
  }

  /**
   * Update an existing rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      logger.warn('Alert rule not found for update', {
        componentName: 'AlertManager',
        operationName: 'updateRule',
        metadata: { ruleId },
      });
      return;
    }

    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);

    logger.info('Alert rule updated', {
      componentName: 'AlertManager',
      operationName: 'updateRule',
      metadata: { ruleId, updates },
    });
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      logger.info('Alert rule removed', {
        componentName: 'AlertManager',
        operationName: 'removeRule',
        metadata: { ruleId },
      });
    }
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info(`Alert rule ${enabled ? 'enabled' : 'disabled'}`, {
        componentName: 'AlertManager',
        operationName: 'setRuleEnabled',
        metadata: { ruleId, enabled },
      });
    }
  }

  /**
   * Check if a condition triggers an alert
   */
  checkCondition(
    condition: AlertCondition,
    value: number,
    metadata?: Record<string, any>
  ): void {
    for (const [ruleId, rule] of this.rules.entries()) {
      if (!rule.enabled) continue;
      if (!this.conditionsMatch(rule.condition, condition)) continue;

      const triggered = this.evaluateCondition(rule.condition, value);
      if (triggered) {
        this.incrementAlertCounter(ruleId, rule);
        
        const counter = this.alertCounters.get(ruleId);
        if (counter && counter.count >= rule.threshold) {
          this.triggerAlert(rule, value, metadata);
          this.resetAlertCounter(ruleId);
        }
      }
    }
  }

  /**
   * Manually trigger an alert
   */
  triggerAlert(
    rule: AlertRule,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const alert: Alert = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `Alert triggered: ${rule.name}`,
      value,
      threshold: rule.threshold,
      timestamp: Date.now(),
      metadata,
    };

    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift(); // Remove oldest alert
    }

    // Execute alert actions
    this.executeActions(rule, alert);

    // Log the alert
    const logLevel = this.severityToLogLevel(rule.severity);
    logger[logLevel]('Alert triggered', undefined, {
      componentName: 'AlertManager',
      operationName: 'triggerAlert',
      metadata: {
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        value,
        threshold: rule.threshold,
        ...metadata,
      },
    });
  }

  /**
   * Get all active alerts
   */
  getAlerts(options?: {
    severity?: AlertRule['severity'];
    ruleId?: string;
    since?: number;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }

    if (options?.ruleId) {
      filtered = filtered.filter(a => a.ruleId === options.ruleId);
    }

    if (options?.since) {
      filtered = filtered.filter(a => a.timestamp >= options.since);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear alerts
   */
  clearAlerts(ruleId?: string): void {
    if (ruleId) {
      this.alerts = this.alerts.filter(a => a.ruleId !== ruleId);
    } else {
      this.alerts = [];
    }

    logger.info('Alerts cleared', {
      componentName: 'AlertManager',
      operationName: 'clearAlerts',
      metadata: { ruleId },
    });
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    byRule: Record<string, number>;
    recentAlerts: Alert[];
  } {
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byRule: Record<string, number> = {};

    for (const alert of this.alerts) {
      bySeverity[alert.severity]++;
      byRule[alert.ruleId] = (byRule[alert.ruleId] || 0) + 1;
    }

    return {
      total: this.alerts.length,
      bySeverity,
      byRule,
      recentAlerts: this.alerts.slice(-10).reverse(),
    };
  }

  private initializeDefaultRules(): void {
    // High error rate rule
    this.registerRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: {
        type: 'error_rate',
        operator: '>',
        value: 10,
      },
      threshold: 5, // 5 errors in time window
      timeWindowMs: 60000, // 1 minute
      severity: 'high',
      enabled: true,
      actions: [
        { type: 'log', config: {} },
        { type: 'toast', config: { title: 'High Error Rate Detected' } },
      ],
    });

    // Slow response time rule
    this.registerRule({
      id: 'slow-response',
      name: 'Slow Response Time',
      condition: {
        type: 'response_time',
        operator: '>',
        value: 5000, // 5 seconds
      },
      threshold: 3, // 3 slow responses
      timeWindowMs: 120000, // 2 minutes
      severity: 'medium',
      enabled: true,
      actions: [
        { type: 'log', config: {} },
      ],
    });

    // High memory usage rule
    this.registerRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      condition: {
        type: 'memory_usage',
        operator: '>',
        value: 85, // 85% of heap
      },
      threshold: 1,
      timeWindowMs: 30000, // 30 seconds
      severity: 'critical',
      enabled: true,
      actions: [
        { type: 'log', config: {} },
        { type: 'toast', config: { title: 'High Memory Usage Warning' } },
      ],
    });
  }

  private conditionsMatch(rule: AlertCondition, check: AlertCondition): boolean {
    return rule.type === check.type && rule.metric === check.metric;
  }

  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case '>': return value > condition.value;
      case '<': return value < condition.value;
      case '=': return value === condition.value;
      case '>=': return value >= condition.value;
      case '<=': return value <= condition.value;
      default: return false;
    }
  }

  private incrementAlertCounter(ruleId: string, rule: AlertRule): void {
    const now = Date.now();
    const counter = this.alertCounters.get(ruleId);

    if (!counter || now - counter.windowStart > rule.timeWindowMs) {
      // Start new window
      this.alertCounters.set(ruleId, { count: 1, windowStart: now });
    } else {
      // Increment in current window
      counter.count++;
    }
  }

  private resetAlertCounter(ruleId: string): void {
    this.alertCounters.delete(ruleId);
  }

  private executeActions(rule: AlertRule, alert: Alert): void {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'log':
            // Already logged by triggerAlert
            break;
          case 'toast':
            // Trigger toast notification
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('show-alert-toast', {
                detail: {
                  title: action.config.title || alert.message,
                  severity: alert.severity,
                },
              }));
            }
            break;
          case 'webhook':
            // Send to webhook endpoint
            this.sendWebhook(action.config.url, alert);
            break;
          case 'email':
            // Queue email (would be handled by backend)
            logger.info('Email alert queued', {
              componentName: 'AlertManager',
              operationName: 'executeActions',
              metadata: { alert, recipient: action.config.recipient },
            });
            break;
        }
      } catch (error) {
        logger.error('Alert action execution failed', error as Error, {
          componentName: 'AlertManager',
          operationName: 'executeActions',
          metadata: { actionType: action.type, ruleId: rule.id },
        });
      }
    }
  }

  private async sendWebhook(url: string, alert: Alert): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      logger.error('Webhook delivery failed', error as Error, {
        componentName: 'AlertManager',
        operationName: 'sendWebhook',
        metadata: { url },
      });
    }
  }

  private severityToLogLevel(severity: AlertRule['severity']): 'info' | 'warn' | 'error' | 'critical' {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warn';
      case 'high': return 'error';
      case 'critical': return 'critical';
    }
  }
}

export const alertManager = new AlertManagerService();
