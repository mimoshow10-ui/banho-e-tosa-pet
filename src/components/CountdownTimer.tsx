'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate, onExpire }: { targetDate: string; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const distance = target - now;

      if (isNaN(target) || distance <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        if (onExpire) onExpire();
        return true;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
      setIsExpired(false);
      return false;
    };

    const expired = calculate();
    if (expired) return;

    const interval = setInterval(() => {
      const done = calculate();
      if (done) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (isExpired) {
    return null;
  }

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 mt-2 bg-red-50 p-2 rounded-lg border border-red-100 inline-flex">
      <span className="text-red-600 font-bold text-xs uppercase tracking-wider">Termina em:</span>
      <div className="flex gap-1 text-red-600 font-mono font-bold text-xs">
        {timeLeft.days > 0 && (
          <>
            <div className="bg-white px-1.5 py-0.5 rounded shadow-sm">{timeLeft.days}d</div>
            <span>:</span>
          </>
        )}
        <div className="bg-white px-1.5 py-0.5 rounded shadow-sm">{timeLeft.hours.toString().padStart(2, '0')}h</div>
        <span>:</span>
        <div className="bg-white px-1.5 py-0.5 rounded shadow-sm">{timeLeft.minutes.toString().padStart(2, '0')}m</div>
        <span>:</span>
        <div className="bg-white px-1.5 py-0.5 rounded shadow-sm">{timeLeft.seconds.toString().padStart(2, '0')}s</div>
      </div>
    </div>
  );
}