'use client';
import { useFarm } from '@/context/FarmContext';
import { useLanguage } from '@/context/LanguageContext';
import StatCard from '@/components/ui/StatCard';
import WarningBanner from '@/components/ui/WarningBanner';
import CarbonChart from '@/components/ui/CarbonChart';
import NasaPanel from '@/components/ui/NasaPanel';
import WeatherWidget from '@/components/ui/WeatherWidget';
import EmissionForm from '@/components/ui/EmissionForm';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Leaf, Thermometer, Droplets, BarChart3, BookOpen,
  FlaskConical, Store, MapPin, AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useLanguage();
  // Client-side only time — avoids SSR hydration mismatch from toLocaleTimeString()
  const [mountedTime, setMountedTime] = useState<string>('');
  const {
    soilMetrics, nasaData, carbonTotals, weatherData,
    criticalReversalRisk, coordinates, locationError, nasaLoading,
  } = useFarm();

  useEffect(() => {
    // Safe: runs after hydration, no SSR mismatch
    setMountedTime(new Date().toLocaleTimeString());
  }, []);

  const totalCo2e = carbonTotals.reduce((sum, e) => sum + e.co2e_kg, 0);
  const latestNasa = nasaData.filter(d => d.t2m_max !== -999 && d.gwettop !== -999).slice(-1)[0] ?? null;

  const quickNavLinks = [
    { href: '/dashboard/ledger', icon: BookOpen, label: t('nav.ledger'), color: 'emerald', desc: 'Full emission history' },
    { href: '/dashboard/verify', icon: FlaskConical, label: t('nav.verify'), color: 'blue', desc: 'AI soil report analysis' },
    { href: '/dashboard/hub', icon: Store, label: t('nav.hub'), color: 'amber', desc: 'Find green suppliers' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t('dashboard.title')}</h1>
          <div className="flex items-center gap-2 mt-1">
            {coordinates ? (
              <span className="flex items-center gap-1 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <MapPin className="w-3.5 h-3.5" />
                {coordinates.lat.toFixed(4)}°N, {coordinates.lon.toFixed(4)}°E
              </span>
            ) : locationError ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <AlertCircle className="w-3 h-3" />{locationError}
              </span>
            ) : (
              <span className="text-xs text-gray-400 animate-pulse">Detecting location...</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mountedTime && (
            <span className="text-xs text-gray-400">{t('dashboard.last_updated')}: {mountedTime}</span>
          )}
        </div>
      </div>

      {/* Critical Reversal Risk Banner */}
      {criticalReversalRisk && (
        <WarningBanner
          title={t('warning.critical_reversal')}
          detail={t('warning.reversal_detail')}
          threshold={t('warning.heat_threshold')}
        />
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.co2e_total')}
          value={totalCo2e > 0 ? totalCo2e.toFixed(1) : '0'}
          unit="kg CO₂e"
          icon={BarChart3}
          color="red"
          trend={totalCo2e > 100 ? 'up' : 'neutral'}
          trendValue={totalCo2e > 0 ? '+this month' : undefined}
        />
        <StatCard
          title={t('dashboard.soil_carbon')}
          value={soilMetrics.soc !== null ? soilMetrics.soc.toFixed(1) : '—'}
          unit={soilMetrics.soc !== null ? '%' : ''}
          icon={Leaf}
          color="emerald"
          subtitle={soilMetrics.lastUpdated
            ? `Updated ${new Date(soilMetrics.lastUpdated).toLocaleDateString('en-IN')}`
            : 'Run soil verify to populate'}
        />
        <StatCard
          title={t('dashboard.temp_max')}
          value={latestNasa ? latestNasa.t2m_max.toFixed(1) : '—'}
          unit={latestNasa ? '°C' : ''}
          icon={Thermometer}
          color={latestNasa && latestNasa.t2m_max > 38 ? 'red' : 'orange'}
          loading={nasaLoading}
          subtitle="NASA POWER • Today"
        />
        <StatCard
          title={t('dashboard.soil_wet')}
          value={latestNasa ? `${(latestNasa.gwettop * 100).toFixed(0)}` : '—'}
          unit={latestNasa ? '%' : ''}
          icon={Droplets}
          color={latestNasa && latestNasa.gwettop < 0.25 ? 'amber' : 'blue'}
          loading={nasaLoading}
          subtitle="NASA POWER • Topsoil"
        />
      </div>

      {/* Main Grid: Chart + Weather + NASA */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Carbon Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.trend')}</h2>
          <CarbonChart nasaData={nasaData} title="7-Day NASA Agroclimatology Telemetry" />
        </div>

        {/* Right Column: Weather + NASA */}
        <div className="space-y-4">
          {/* Weather Widget */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              ☁️ {t('dashboard.weather')}
            </h3>
            <WeatherWidget data={weatherData} loading={!weatherData && !!coordinates} />
          </div>

          {/* NASA Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <NasaPanel />
          </div>
        </div>
      </div>

      {/* Emission Logger */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            {t('emission.title')}
          </h2>
          <EmissionForm />
        </div>

        {/* Quick Navigation */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Quick Access</h2>
          {quickNavLinks.map(({ href, icon: Icon, label, color, desc }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group ${
                color === 'emerald' ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-400' :
                color === 'blue' ? 'border-blue-200 bg-blue-50 hover:border-blue-400' :
                'border-amber-200 bg-amber-50 hover:border-amber-400'
              }`}
            >
              <div className={`p-3 rounded-xl ${
                color === 'emerald' ? 'bg-emerald-100' :
                color === 'blue' ? 'bg-blue-100' : 'bg-amber-100'
              }`}>
                <Icon className={`w-6 h-6 ${
                  color === 'emerald' ? 'text-emerald-700' :
                  color === 'blue' ? 'text-blue-700' : 'text-amber-700'
                }`} />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{label}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-emerald-500 transition-colors text-xl">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
