'use client';
import { useFarm } from '@/context/FarmContext';
import { useLanguage } from '@/context/LanguageContext';
import { Satellite, Thermometer, Droplets, CloudRain, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NasaPanel() {
  const { nasaData, nasaLoading, criticalReversalRisk, refreshNasaData, coordinates } = useFarm();
  const { t } = useLanguage();

  // NASA uses -999 as a sentinel for missing/unprocessed data — filter it out
  const validData = nasaData.filter(d => d.t2m_max !== -999 && d.gwettop !== -999);
  const latest = validData[validData.length - 1] ?? null;

  const metrics = latest ? [
    {
      icon: Thermometer,
      label: t('nasa.t2m_max'),
      value: `${latest.t2m_max.toFixed(1)}°C`,
      alert: latest.t2m_max > 38,
      color: latest.t2m_max > 38 ? 'text-red-700' : 'text-orange-700',
      bg: latest.t2m_max > 38 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200',
    },
    {
      icon: Droplets,
      label: t('nasa.gwettop'),
      value: `${(latest.gwettop * 100).toFixed(0)}%`,
      alert: latest.gwettop < 0.25,
      color: latest.gwettop < 0.25 ? 'text-amber-700' : 'text-blue-700',
      bg: latest.gwettop < 0.25 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200',
    },
    {
      icon: CloudRain,
      label: t('nasa.prectot'),
      value: latest.prectot >= 0 ? `${latest.prectot.toFixed(1)} mm` : 'N/A',
      alert: false,
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-100',
    },
  ] : [];


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800">{t('nasa.title')}</h3>
        </div>
        <button
          onClick={refreshNasaData}
          disabled={nasaLoading || !coordinates}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', nasaLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {!coordinates && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Enable location access to load NASA telemetry
        </div>
      )}

      {nasaLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!nasaLoading && metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {metrics.map(({ icon: Icon, label, value, color, bg, alert }) => (
            <div key={label} className={cn('p-3 rounded-xl border', bg)}>
              <div className="flex items-center gap-1 mb-1">
                <Icon className={cn('w-4 h-4', color)} />
                {alert && <AlertCircle className="w-3 h-3 text-red-500" />}
              </div>
              <p className={cn('text-lg font-bold', color)}>{value}</p>
              <p className="text-xs text-gray-500 leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {criticalReversalRisk && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">
            3+ consecutive days of high temperature &amp; low topsoil moisture detected.
          </p>
        </div>
      )}

      {!nasaLoading && nasaData.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {t('nasa.7day_label')} · NASA POWER Agroclimatology
        </p>
      )}
    </div>
  );
}
