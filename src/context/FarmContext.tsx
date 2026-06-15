'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { checkReversalRisk } from '@/lib/climateRisk';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface SoilMetrics {
  soc: number | null;
  nitrogen: number | null;
  ph: number | null;
  bulkDensity: number | null;
  lastUpdated: string | null;
}

export interface NasaDataPoint {
  date: string;
  t2m_max: number;
  gwettop: number;
  prectot: number;
}

export interface CarbonTotal {
  month: string;
  co2e_kg: number;
}

export interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  icon: string;
  city: string;
}

interface FarmContextType {
  farmId: string;
  coordinates: Coordinates | null;
  soilMetrics: SoilMetrics;
  nasaData: NasaDataPoint[];
  carbonTotals: CarbonTotal[];
  weatherData: WeatherData | null;
  criticalReversalRisk: boolean;
  locationError: string | null;
  nasaLoading: boolean;
  updateCoordinates: (coords: Coordinates) => void;
  updateSoilMetrics: (metrics: Partial<SoilMetrics>) => void;
  updateCarbonTotals: (entry: CarbonTotal) => void;
  refreshNasaData: () => void;
}

const FarmContext = createContext<FarmContextType>({
  farmId: 'farm-default',
  coordinates: null,
  soilMetrics: { soc: null, nitrogen: null, ph: null, bulkDensity: null, lastUpdated: null },
  nasaData: [],
  carbonTotals: [],
  weatherData: null,
  criticalReversalRisk: false,
  locationError: null,
  nasaLoading: false,
  updateCoordinates: () => {},
  updateSoilMetrics: () => {},
  updateCarbonTotals: () => {},
  refreshNasaData: () => {},
});

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}



export function FarmProvider({ children }: { children: React.ReactNode }) {
  // Start with stable empty string — set client-side only to avoid hydration mismatch
  const [farmId, setFarmId] = useState('farm-default');

  useEffect(() => {
    // Generate a stable session ID client-side only
    const stored = sessionStorage.getItem('krishicarbon_farm_id');
    if (stored) {
      setFarmId(stored);
    } else {
      const id = 'farm-' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('krishicarbon_farm_id', id);
      setFarmId(id);
    }
  }, []);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [soilMetrics, setSoilMetrics] = useState<SoilMetrics>({
    soc: null, nitrogen: null, ph: null, bulkDensity: null, lastUpdated: null,
  });
  const [nasaData, setNasaData] = useState<NasaDataPoint[]>([]);
  const [carbonTotals, setCarbonTotals] = useState<CarbonTotal[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [criticalReversalRisk, setCriticalReversalRisk] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nasaLoading, setNasaLoading] = useState(false);
  const coordsRef = useRef<Coordinates | null>(null);

  // Auto-detect geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setCoordinates(coords);
          coordsRef.current = coords;
        },
        (err) => setLocationError('Location access denied. Enter coordinates manually.'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const fetchNasaData = useCallback(async (coords: Coordinates, forceRefresh = false) => {
    // Efficiency: cache NASA data in sessionStorage for 1 hour (data is daily, not hourly)
    const cacheKey = `nasa_${coords.lat.toFixed(3)}_${coords.lon.toFixed(3)}`;
    const cacheTTL = 60 * 60 * 1000; // 1 hour in ms

    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached) as { data: NasaDataPoint[]; timestamp: number };
          if (Date.now() - timestamp < cacheTTL) {
            setNasaData(data);
            setCriticalReversalRisk(checkReversalRisk(data));
            return; // use cached data, skip network call
          }
        }
      } catch { /* corrupt cache — ignore and fetch fresh */ }
    }

    setNasaLoading(true);
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const end = formatDate(today);
      const start = formatDate(sevenDaysAgo);

      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,PRECTOTCORR,GWETTOP&community=ag&longitude=${coords.lon}&latitude=${coords.lat}&start=${start}&end=${end}&format=JSON`;
      const res = await fetch(url);
      const json = await res.json();

      const properties = json?.properties?.parameter;
      if (!properties) throw new Error('Invalid NASA response');

      const t2m = properties['T2M_MAX'] as Record<string, number>;
      const gwet = properties['GWETTOP'] as Record<string, number>;
      const prec = properties['PRECTOTCORR'] as Record<string, number>;

      const points: NasaDataPoint[] = Object.keys(t2m).map((dateKey) => ({
        date: dateKey,
        t2m_max: t2m[dateKey],
        gwettop: gwet[dateKey],
        prectot: prec[dateKey],
      }));

      // Store in sessionStorage cache
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: points, timestamp: Date.now() }));
      } catch { /* sessionStorage full — skip caching */ }

      setNasaData(points);
      setCriticalReversalRisk(checkReversalRisk(points));
    } catch (e) {
      console.error('NASA POWER fetch failed:', e);
    } finally {
      setNasaLoading(false);
    }
  }, []);

  const fetchWeather = useCallback(async (coords: Coordinates) => {
    try {
      // Proxied through our API route — OWM key stays server-side only
      const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`);
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();
      setWeatherData({
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        icon: data.weather[0].icon,
        city: data.name,
      });
    } catch (e) {
      console.error('Weather fetch failed:', e);
    }
  }, []);

  useEffect(() => {
    if (coordinates) {
      fetchNasaData(coordinates);
      fetchWeather(coordinates);
    }
  }, [coordinates, fetchNasaData, fetchWeather]);

  const updateCoordinates = (coords: Coordinates) => {
    setCoordinates(coords);
    coordsRef.current = coords;
  };

  const updateSoilMetrics = (metrics: Partial<SoilMetrics>) => {
    setSoilMetrics((prev) => ({
      ...prev,
      ...metrics,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateCarbonTotals = (entry: CarbonTotal) => {
    setCarbonTotals((prev) => {
      const exists = prev.findIndex((e) => e.month === entry.month);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = { ...updated[exists], co2e_kg: updated[exists].co2e_kg + entry.co2e_kg };
        return updated;
      }
      return [...prev, entry];
    });
  };

  const refreshNasaData = () => {
    if (coordinates) fetchNasaData(coordinates);
  };

  return (
    <FarmContext.Provider value={{
      farmId, coordinates, soilMetrics, nasaData, carbonTotals,
      weatherData, criticalReversalRisk, locationError, nasaLoading,
      updateCoordinates, updateSoilMetrics, updateCarbonTotals, refreshNasaData,
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  return useContext(FarmContext);
}
