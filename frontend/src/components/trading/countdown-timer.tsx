'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type CountdownTimerProps = {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
};

export function CountdownTimer({ expiresAt, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        if (onExpire) {
          onExpire();
        }
        return 0;
      }

      return difference;
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isExpired) {
    return (
      <div className={cn("flex items-center gap-2 text-xs font-medium text-yellow-400", className)}>
        <Clock className="size-3" />
        <span>Timer Expired</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs font-medium", className)}>
      <Clock className="size-3 animate-pulse text-blue-400" />
      <span className="text-blue-300 font-mono">{formatTime(timeLeft)}</span>
      <span className="text-white/60">remaining</span>
    </div>
  );
}












