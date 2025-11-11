/**
 * Alert Monitoring Hook
 * React hook for subscribing to and displaying alerts
 */

import { useState, useEffect } from 'react';
import { alertManager, Alert } from '@/lib/monitoring/AlertManager';
import { useToast } from '@/hooks/use-toast';

export function useAlertMonitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to alert toast events
    const handleAlertToast = (event: CustomEvent) => {
      const { title, severity } = event.detail;
      
      toast({
        title,
        variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default',
      });
    };

    window.addEventListener('show-alert-toast', handleAlertToast as EventListener);

    // Poll for alerts with faster refresh
    const pollInterval = setInterval(() => {
      const recentAlerts = alertManager.getAlerts({ since: Date.now() - 300000 }); // Last 5 minutes
      setAlerts(recentAlerts);
    }, 3000); // Every 3 seconds for real-time feel

    return () => {
      window.removeEventListener('show-alert-toast', handleAlertToast as EventListener);
      clearInterval(pollInterval);
    };
  }, [toast]);

  const clearAlerts = (ruleId?: string) => {
    alertManager.clearAlerts(ruleId);
    setAlerts(alertManager.getAlerts());
  };

  const getStatistics = () => {
    return alertManager.getAlertStatistics();
  };

  return {
    alerts,
    clearAlerts,
    getStatistics,
  };
}
