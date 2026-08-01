import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatSeconds } from '../utils/formatters';

interface ExpirationTimerProps {
  expiresAt: number;
  onExpired?: () => void;
  compact?: boolean;
}

export const ExpirationTimer: React.FC<ExpirationTimerProps> = ({
  expiresAt,
  onExpired,
  compact = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        if (onExpired) onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const isWarning = secondsLeft > 0 && secondsLeft < 300; // < 5 mins
  const isExpired = secondsLeft === 0;

  // Total duration: 30 minutes (1800s)
  const percentage = Math.min(100, Math.max(0, (secondsLeft / 1800) * 100));

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          isExpired
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : isWarning
            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>{formatSeconds(secondsLeft)}</span>
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-xl border flex items-center justify-between ${
        isExpired
          ? 'bg-rose-50/80 border-rose-200 text-rose-800'
          : isWarning
          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isWarning ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
        )}
        <div>
          <span className="text-xs font-semibold block">
            {isExpired
              ? 'File Expired'
              : isWarning
              ? 'Expiring Soon!'
              : 'Auto Expiration'}
          </span>
          <span className="text-[11px] opacity-80">Files are deleted after 30 minutes</span>
        </div>
      </div>

      <div className="text-right">
        <span className="font-mono text-sm font-bold text-slate-900 block">
          {formatSeconds(secondsLeft)}
        </span>
        <div className="w-20 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              isWarning ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
