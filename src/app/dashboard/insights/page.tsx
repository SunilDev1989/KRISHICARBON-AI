'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFarm } from '@/context/FarmContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/config/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import {
  Lightbulb, Leaf, TrendingDown, Clock, IndianRupee,
  Sprout, Flame, Droplets, Zap, TreePine, RefreshCw,
  ChevronRight, Info, AlertTriangle, CheckCircle2,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────────── */
interface Suggestion {
  rank: number;
  title: string;
  description: string;
  co2eSavingKgPerSeason: number;
  costLevel: string;
  timeToImpact: string;
  category: string;
  ipccBasis: string;
}

interface EmissionLog {
  id: string;
  fertilizerType: string | null;
  massKg: number | null;
  residueType: string | null;
  co2e_kg: number;
}

/* ── Category metadata ───────────────────────────────────────────────── */
const CATEGORY_META: Record<string, { icon: typeof Leaf; color: string; bg: string }> = {
  Fertilizer:   { icon: Sprout,    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Residue:      { icon: Flame,     color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
  Soil:         { icon: Leaf,      color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  Water:        { icon: Droplets,  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  Energy:       { icon: Zap,       color: 'text-yellow-700',  bg: 'bg-yellow-50 border-yellow-200' },
  Agroforestry: { icon: TreePine,  color: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
};

/* ── Cost badge ──────────────────────────────────────────────────────── */
function CostBadge({ level, displayLabel }: { level: string; displayLabel?: string }) {
  const styles: Record<string, string> = {
    'Free':                  'bg-green-100 text-green-800 border-green-200',
    'Low (₹500-2000)':       'bg-blue-100 text-blue-800 border-blue-200',
    'Medium (₹2000-10000)':  'bg-orange-100 text-orange-800 border-orange-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[level] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      <IndianRupee className="w-3 h-3" />
      {displayLabel ?? level}
    </span>
  );
}

/* ── Time badge ──────────────────────────────────────────────────────── */
function TimeBadge({ time, displayLabel }: { time: string; displayLabel?: string }) {
  const styles: Record<string, string> = {
    'Immediate': 'bg-emerald-100 text-emerald-800',
    '1 Season':  'bg-yellow-100 text-yellow-800',
    '1-2 Years': 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[time] ?? 'bg-gray-100 text-gray-700'}`}>
      <Clock className="w-3 h-3" />
      {time}
    </span>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */
export default function InsightsPage() {
  const { carbonTotals, farmId } = useFarm();
  const { t, locale } = useLanguage();

  /* ── Translation maps for Gemini enum values ─────────────────────── */
  const CATEGORY_LABELS: Record<string, string> = {
    Fertilizer:   t('insights.cat.fertilizer'),
    Residue:      t('insights.cat.residue'),
    Soil:         t('insights.cat.soil'),
    Water:        t('insights.cat.water'),
    Energy:       t('insights.cat.energy'),
    Agroforestry: t('insights.cat.agroforestry'),
  };

  const COST_LABELS: Record<string, string> = {
    'Free':                  t('insights.cost.free'),
    'Low (₹500-2000)':       t('insights.cost.low'),
    'Medium (₹2000-10000)':  t('insights.cost.medium'),
  };

  const TIME_LABELS: Record<string, string> = {
    'Immediate': t('insights.time.immediate'),
    '1 Season':  t('insights.time.one_season'),
    '1-2 Years': t('insights.time.one_two_years'),
  };

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [latestLog, setLatestLog] = useState<EmissionLog | null>(null);

  /* Total CO₂e across all months */
  const totalCo2e = carbonTotals.reduce((sum, c) => sum + (c.co2e_kg ?? 0), 0);
  const monthCount = carbonTotals.length;

  /* Awareness facts — defined inside component so t() is available */
  const AWARENESS_FACTS = [
    { icon: '🌾', stat: '18%',           label: t('insights.fact.1'), source: 'IPCC AR6, 2022' },
    { icon: '💧', stat: '273×',          label: t('insights.fact.2'), source: 'IPCC AR6 GWP100' },
    { icon: '🔥', stat: '1,520 kg',      label: t('insights.fact.3'), source: 'IPCC 2006 GL Vol 4' },
    { icon: '🌱', stat: '1 hectare',     label: t('insights.fact.4'), source: 'FAO Soils Bulletin' },
    { icon: '💰', stat: '₹500–₹2,000',  label: t('insights.fact.5'), source: 'Gold Standard, 2024' },
    { icon: '🌳', stat: '34 trees',      label: t('insights.fact.6'), source: 'IPCC 2006 GL Agroforestry' },
  ];

  /* Fetch most recent emission log for personalisation */
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const q = query(
          collection(db, 'emissionLogs'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setLatestLog({ id: doc.id, ...doc.data() } as EmissionLog);
        }
      } catch {
        // Offline — suggestions will use defaults
      }
    };
    fetchLatest();
  }, [farmId]);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fertilizerType: latestLog?.fertilizerType ?? 'Urea',
          massKg:         latestLog?.massKg ?? 0,
          residueType:    latestLog?.residueType ?? 'unknown',
          totalCo2eKg:    totalCo2e,
          monthlyRecords: monthCount,
          lang:           locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get suggestions');
      setSuggestions(data.suggestions);
      setAiModel(data.model);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading suggestions');
    } finally {
      setLoading(false);
    }
  }, [latestLog, totalCo2e, monthCount]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const totalPotentialSaving = suggestions.reduce(
    (sum, s) => sum + (s.co2eSavingKgPerSeason ?? 0), 0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-semibold">
          <Lightbulb className="w-4 h-4" />
          {t('insights.badge')}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('insights.title')}
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm">
          {t('insights.subtitle')}
        </p>
      </div>

      {/* ── Summary Banner ─────────────────────────────────────────── */}
      {carbonTotals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { labelKey: 'insights.stat.co2e',   value: `${totalCo2e.toFixed(1)} kg CO₂e`, icon: TrendingDown, color: 'text-red-600' },
            { labelKey: 'insights.stat.months',  value: monthCount.toString(),              icon: CheckCircle2, color: 'text-blue-600' },
            { labelKey: 'insights.stat.saving',  value: `${totalPotentialSaving.toFixed(0)} kg CO₂e`, icon: Leaf, color: 'text-emerald-600' },
          ].map(({ labelKey, value, icon: Icon, color }) => (
            <div key={labelKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Suggestions ─────────────────────────────────────────── */}
      <section aria-label={t('insights.suggestions.title')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {t('insights.suggestions.title')}
            {aiModel && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                {aiModel === 'static-fallback'
                  ? t('insights.suggestions.via_ipcc')
                  : `${t('insights.suggestions.via_gemini')} (${aiModel})`}
              </span>
            )}
          </h2>
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            aria-label={t('insights.suggestions.refresh')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('insights.suggestions.refresh')}
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label={t('common.loading')}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const meta = CATEGORY_META[s.category] ?? CATEGORY_META.Soil;
              const Icon = meta.icon;
              const isExpanded = expandedCard === s.rank;

              return (
                <article
                  key={s.rank}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    className="w-full text-left p-5 flex items-start gap-4"
                    onClick={() => setExpandedCard(isExpanded ? null : s.rank)}
                    aria-expanded={isExpanded}
                    aria-controls={`suggestion-detail-${s.rank}`}
                  >
                    {/* Rank badge */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">
                      {s.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                          <Icon className="w-3 h-3" />
                          {CATEGORY_LABELS[s.category] ?? s.category}
                        </span>
                        <CostBadge level={s.costLevel} displayLabel={COST_LABELS[s.costLevel]} />
                        <TimeBadge time={s.timeToImpact} displayLabel={TIME_LABELS[s.timeToImpact]} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{s.title}</h3>
                      <p className="text-sm text-emerald-700 font-medium mt-0.5">
                        {t('insights.suggestions.save_prefix')}{s.co2eSavingKgPerSeason.toLocaleString()} {t('insights.suggestions.save_suffix')}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div id={`suggestion-detail-${s.rank}`} className="px-5 pb-5 border-t border-gray-50">
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                        {s.description}
                      </p>
                      <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                          <span className="font-semibold">{t('insights.suggestions.science_basis')} </span>
                          {s.ipccBasis}
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Carbon Awareness Section ────────────────────────────────── */}
      <section aria-label={t('insights.awareness.title')}>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-600" />
          {t('insights.awareness.title')}
          <span className="text-xs font-normal text-gray-400">{t('insights.awareness.subtitle')}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AWARENESS_FACTS.map((fact) => (
            <div
              key={fact.stat}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">{fact.icon}</div>
              <p className="text-2xl font-black text-emerald-700 mb-1">{fact.stat}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{fact.label}</p>
              <p className="text-xs text-gray-400 mt-2 italic">{t('insights.awareness.source')} {fact.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Carbon Market Awareness ─────────────────────────────────── */}
      <section
        aria-label={t('insights.market.title')}
        className="bg-gradient-to-br from-emerald-700 to-green-800 text-white rounded-2xl p-6 space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">💹</span>
          <h2 className="text-lg font-bold">{t('insights.market.title')}</h2>
        </div>
        <p className="text-emerald-100 text-sm leading-relaxed">
          {t('insights.market.body')}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { labelKey: 'insights.market.price_label',    value: '₹500–₹2,000/tonne' },
            { labelKey: 'insights.market.size_label',     value: '~20 farmers pooled' },
            { labelKey: 'insights.market.standard_label', value: 'IPCC Tier 1 ✓' },
          ].map(({ labelKey, value }) => (
            <div key={labelKey} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-emerald-300 text-xs mt-0.5">{t(labelKey)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-emerald-300 mt-2">
          {t('insights.market.source')}
        </p>
      </section>

    </div>
  );
}
