import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from 'lucide-react';

const SESSION_TIMEOUT_WARNING = 5 * 60 * 1000; // 5 minutes before timeout
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour total

export function SessionTimeoutWarning() {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    if (!user) return;

    let warningTimeout: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
      setShowWarning(false);
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      
      warningTimeout = setTimeout(() => {
        setShowWarning(true);
        setTimeRemaining(5 * 60);
        
        countdownInterval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              // Force logout
              window.location.href = '/auth';
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, SESSION_TIMEOUT_WARNING);
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) { // Throttle to once per second
        resetTimer();
      }
    };

    // Listen for user activity
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [user]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    // Trigger activity to reset timer
    window.dispatchEvent(new Event('mousedown'));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in <span className="font-bold text-warning">{formatTime(timeRemaining)}</span> due to inactivity.
            You will be automatically logged out if no action is taken.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
