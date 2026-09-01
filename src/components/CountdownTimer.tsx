'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setIsExpired(true);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (isExpired) {
    return <div className="text-red-500 font-bold text-sm">Promoção Encerrada!</div>;
  }

  return (
    <div className="flex items-center gap-2 mt-2 bg-red-50 p-2 rounded-lg border border-red-100 inline-flex">
      <span className="text-red-600 font-bold text-xs uppercase tracking-wider">Termina em:</span>
      <div className="flex gap-1 text-red-600 font-mono font-bold">
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