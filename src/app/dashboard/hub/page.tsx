'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useFarm } from '@/context/FarmContext';
import SupplierCard from '@/components/ui/SupplierCard';
import { Store, Search, MapPin, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const SEARCH_CATEGORIES = [
  { id: 'organic', query: 'organic fertilizer distributor', label: 'Organic Fertilizer', emoji: '🌱' },
  { id: 'solar', query: 'solar water pump dealer', label: 'Solar Water Pumps', emoji: '☀️' },
  { id: 'biochar', query: 'biochar compost organic farming', label: 'Biochar & Compost', emoji: '🪨' },
  { id: 'seeds', query: 'organic certified seeds supplier', label: 'Organic Seeds', emoji: '🌾' },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HubPage() {
  const { t } = useLanguage();
  const { coordinates, locationError } = useFarm();
  const [activeCategory, setActiveCategory] = useState('organic');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const searchSuppliers = async (categoryId: string) => {
    if (!coordinates) {
      setError('Location required. Please enable location access.');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveCategory(categoryId);

    const category = SEARCH_CATEGORIES.find((c) => c.id === categoryId)!;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const query = `${category.query} near me`;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${coordinates.lat},${coordinates.lon}&radius=30000&key=${apiKey}`;

      // Note: Direct Places API calls from browser require API key with browser restrictions set properly
      // We'll use a Next.js API route to proxy this in production
      const res = await fetch(`/api/places?query=${encodeURIComponent(category.query)}&lat=${coordinates.lat}&lon=${coordinates.lon}`);

      if (!res.ok) throw new Error('Places API request failed');
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        const mapped: Supplier[] = data.results.slice(0, 9).map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          placeId: place.place_id,
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
          open_now: place.opening_hours?.open_now,
          category: categoryId,
          distance_km: place.geometry?.location
            ? haversineKm(coordinates.lat, coordinates.lon, place.geometry.location.lat, place.geometry.location.lng)
            : undefined,
        }));
        mapped.sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
        setSuppliers(mapped);
      } else {
        setSuppliers([]);
      }
      setSearched(true);
    } catch (e) {
      setError('Could not fetch suppliers. Check your Google Maps API key configuration.');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coordinates && !searched) {
      searchSuppliers('organic');
    }
  }, [coordinates]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <Store className="w-8 h-8 text-amber-600" />
          {t('hub.title')}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">{t('hub.subtitle')}</p>
      </div>

      {/* Location Status */}
      <div className="flex items-center gap-3">
        {coordinates ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
            <MapPin className="w-4 h-4" />
            Searching near {coordinates.lat.toFixed(3)}°N, {coordinates.lon.toFixed(3)}°E
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4" />
            {locationError ?? 'Detecting location...'}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {SEARCH_CATEGORIES.map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => searchSuppliers(id)}
            disabled={!coordinates || loading}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 disabled:opacity-40',
              activeCategory === id
                ? 'border-amber-500 bg-amber-50 text-amber-800'
                : 'border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50/50'
            )}
          >
            <span>{emoji}</span> {label}
          </button>
        ))}
        <button
          onClick={() => searchSuppliers(activeCategory)}
          disabled={!coordinates || loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border-2 border-gray-200 disabled:opacity-40"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t('hub.fetch_error')}</p>
            <p className="text-sm mt-0.5">{error}</p>
            <p className="text-xs mt-2 text-red-500">
              Ensure your Google Maps API key has Places API enabled with proper domain restrictions.
            </p>
          </div>
        </div>
      ) : suppliers.length === 0 && searched ? (
        <div className="text-center py-16">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{t('hub.no_results')}</p>
        </div>
      ) : suppliers.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier, i) => (
            <SupplierCard key={supplier.placeId ?? i} supplier={supplier} />
          ))}
        </div>
      ) : !searched && coordinates ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : null}

      {/* Info Note */}
      <div className="text-xs text-gray-400 text-center">
        Powered by Google Places API · Results within 30km radius · Distance calculated via Haversine formula
      </div>
    </div>
  );
}
