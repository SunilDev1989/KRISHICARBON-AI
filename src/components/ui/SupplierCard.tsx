'use client';
import { MapPin, Phone, ExternalLink, Navigation } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Supplier {
  name: string;
  address: string;
  distance_km?: number;
  phone?: string;
  rating?: number;
  placeId?: string;
  lat?: number;
  lng?: number;
  open_now?: boolean;
  category: string;
}

interface SupplierCardProps {
  supplier: Supplier;
}

const categoryColors: Record<string, string> = {
  organic: 'bg-emerald-100 text-emerald-700',
  solar: 'bg-amber-100 text-amber-700',
  biochar: 'bg-brown-100 text-orange-700',
  default: 'bg-blue-100 text-blue-700',
};

export default function SupplierCard({ supplier }: SupplierCardProps) {
  const { t } = useLanguage();
  const catColor = categoryColors[supplier.category] ?? categoryColors.default;

  const mapsUrl = supplier.lat && supplier.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${supplier.lat},${supplier.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(supplier.name + ' ' + supplier.address)}`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
              {supplier.category}
            </span>
            {supplier.open_now !== undefined && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                supplier.open_now ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {supplier.open_now ? '🟢 Open' : '🔴 Closed'}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 mt-2 leading-tight group-hover:text-emerald-700 transition-colors">
            {supplier.name}
          </h3>
          <div className="flex items-start gap-1 mt-1">
            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">{supplier.address}</p>
          </div>
        </div>
        {supplier.distance_km !== undefined && (
          <div className="flex-shrink-0 text-right">
            <p className="text-lg font-bold text-emerald-700">{supplier.distance_km.toFixed(1)}</p>
            <p className="text-xs text-gray-400">{t('hub.distance')}</p>
          </div>
        )}
      </div>

      {supplier.rating && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-amber-400">{'★'.repeat(Math.round(supplier.rating))}</span>
          <span className="text-xs text-gray-500">{supplier.rating.toFixed(1)}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Navigation className="w-3 h-3" />{t('hub.directions')}
        </a>
        {supplier.phone && (
          <a
            href={`tel:${supplier.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <Phone className="w-3 h-3" />{t('hub.call')}
          </a>
        )}
        {supplier.placeId && (
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${supplier.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
