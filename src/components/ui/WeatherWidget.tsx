'use client';
import { Cloud, Droplets, Thermometer, Wind } from 'lucide-react';
import { WeatherData } from '@/context/FarmContext';
import { useLanguage } from '@/context/LanguageContext';

interface WeatherWidgetProps {
  data: WeatherData | null;
  loading?: boolean;
}

export default function WeatherWidget({ data, loading }: WeatherWidgetProps) {
  const { t } = useLanguage();

  if (loading || !data) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-gray-200 rounded-lg w-2/3" />
        <div className="h-6 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

  return (
    <div className="flex items-center gap-4">
      <img
        src={iconUrl}
        alt={data.description}
        className="w-16 h-16 drop-shadow-md"
      />
      <div>
        <p className="text-3xl font-bold text-blue-800">{data.temp}°C</p>
        <p className="text-sm font-medium text-blue-600 capitalize">{data.description}</p>
        <p className="text-xs text-gray-500 mt-0.5">📍 {data.city}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Droplets className="w-3 h-3 text-blue-400" />{data.humidity}% humidity
          </span>
        </div>
      </div>
    </div>
  );
}
