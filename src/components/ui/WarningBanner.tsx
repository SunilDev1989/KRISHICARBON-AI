'use client';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface WarningBannerProps {
  title: string;
  detail: string;
  threshold?: string;
  dismissible?: boolean;
}

export default function WarningBanner({ title, detail, threshold, dismissible = true }: WarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-5 shadow-lg animate-pulse-slow">
      {/* Animated background stripe */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: 'repeating-linear-gradient(-45deg, #ef4444 0, #ef4444 10px, transparent 10px, transparent 20px)'
        }} />
      </div>
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 bg-red-100 rounded-xl p-3">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-red-800 font-bold text-lg leading-tight">{title}</h3>
          <p className="text-red-700 mt-1 text-sm leading-relaxed">{detail}</p>
          {threshold && (
            <p className="text-red-500 mt-2 text-xs font-medium bg-red-100 inline-block px-3 py-1 rounded-full">
              {threshold}
            </p>
          )}
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-700 transition-colors p-1 rounded-lg hover:bg-red-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
