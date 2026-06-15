'use client';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'emerald' | 'amber' | 'red' | 'blue' | 'orange';
  loading?: boolean;
  subtitle?: string;
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-800',
    title: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-amber-800',
    title: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'bg-red-100 text-red-700',
    value: 'text-red-800',
    title: 'text-red-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-800',
    title: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'bg-orange-100 text-orange-700',
    value: 'text-orange-800',
    title: 'text-orange-600',
  },
};

export default function StatCard({
  title, value, unit, icon: Icon, trend, trendValue, color = 'emerald', loading, subtitle
}: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn(
      'rounded-2xl border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
      c.bg, c.border
    )}>
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl', c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <span className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full',
            trend === 'up' ? 'bg-red-100 text-red-700' :
            trend === 'down' ? 'bg-emerald-100 text-emerald-700' :
            'bg-gray-100 text-gray-600'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        ) : (
          <>
            <p className={cn('text-3xl font-bold tracking-tight', c.value)}>
              {value}
              {unit && <span className="text-lg font-medium ml-1 opacity-70">{unit}</span>}
            </p>
            <p className={cn('text-sm font-semibold mt-1', c.title)}>{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </>
        )}
      </div>
    </div>
  );
}
