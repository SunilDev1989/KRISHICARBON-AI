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

/* ── Awareness facts ─────────────────────────────────────────────────── */
const AWARENESS_FACTS = [
  { icon: '🌾', stat: '18%',       label: 'of global greenhouse gas emissions come from agriculture',                           source: 'IPCC AR6, 2022' },
  { icon: '💧', stat: '273×',      label: "more potent than CO₂ — that's the global warming impact of N₂O from fertilizers",   source: 'IPCC AR6 GWP100' },
  { icon: '🔥', stat: '1,520 kg',  label: 'CO₂e released by burning just 1 tonne of wheat stubble',                            source: 'IPCC 2006 GL Vol 4' },
  { icon: '🌱', stat: '1 hectare', label: 'of healthy farmland can sequester up to 600 kg CO₂ per year through good soil practices', source: 'FAO Soils Bulletin' },
  { icon: '💰', stat: '₹500–₹2,000', label: 'per tonne CO₂e is the current voluntary carbon market price accessible to farmers', source: 'Gold Standard, 2024' },
  { icon: '🌳', stat: '34 trees',  label: 'planted on a 1-hectare farm border absorb the equivalent of burning 1 bag of urea',  source: 'IPCC 2006 GL Agroforestry' },
];

/* ── Cost badge ──────────────────────────────────────────────────────── */
function CostBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    'Free':                  'bg-green-100 text-green-800 border-green-200',
    'Low (₹500-2000)':       'bg-blue-100 text-blue-800 border-blue-200',
    'Medium (₹2000-10000)':  'bg-orange-100 text-orange-800 border-orange-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[level] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      <IndianRupee className="w-3 h-3" />
      {level}
    </span>
  );
}

/* ── Time badge ──────────────────────────────────────────────────────── */
function TimeBadge({ time }: { time: string }) {
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
  const { t } = useLanguage();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [latestLog, setLatestLog] = useState<EmissionLog | null>(null);

  /* Total CO₂e across all months */
  const totalCo2e = carbonTotals.reduce((sum, c) => sum + (c.co2e_kg ?? 0), 0);
  const monthCount = carbonTotals.length;

  /* Fetch the most recent emission log for personalization */
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
          AI Carbon Insights
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Reduce Your Carbon Footprint
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm">
          Personalised suggestions based on your farm data, grounded in IPCC guidelines.
          Each recommendation includes estimated CO₂e savings.
        </p>
      </div>

      {/* ── Summary Banner ─────────────────────────────────────────── */}
      {carbonTotals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total CO₂e Logged', value: `${totalCo2e.toFixed(1)} kg CO₂e`, icon: TrendingDown, color: 'text-red-600' },
            { label: 'Months Tracked', value: monthCount.toString(), icon: CheckCircle2, color: 'text-blue-600' },
            { label: 'Potential Seasonal Saving', value: `${totalPotentialSaving.toFixed(0)} kg CO₂e`, icon: Leaf, color: 'text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Suggestions ─────────────────────────────────────────── */}
      <section aria-label="AI Carbon Reduction Suggestions">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Personalised Suggestions
            {aiModel && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                via {aiModel === 'static-fallback' ? 'IPCC guidelines' : `Gemini (${aiModel})`}
              </span>
            )}
          </h2>
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            aria-label="Refresh suggestions"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading suggestions">
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
                          {s.category}
                        </span>
                        <CostBadge level={s.costLevel} />
                        <TimeBadge time={s.timeToImpact} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{s.title}</h3>
                      <p className="text-sm text-emerald-700 font-medium mt-0.5">
                        💚 Save ~{s.co2eSavingKgPerSeason.toLocaleString()} kg CO₂e per season
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
                          <span className="font-semibold">Science basis: </span>
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
      <section aria-label="Carbon Footprint Awareness">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-600" />
          Did You Know?
          <span className="text-xs font-normal text-gray-400">Carbon footprint facts for farmers</span>
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
              <p className="text-xs text-gray-400 mt-2 italic">Source: {fact.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Carbon Market Awareness ─────────────────────────────────── */}
      <section
        aria-label="Carbon Credit Market Information"
        className="bg-gradient-to-br from-emerald-700 to-green-800 text-white rounded-2xl p-6 space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">💹</span>
          <h2 className="text-lg font-bold">Your Carbon Data Has Value</h2>
        </div>
        <p className="text-emerald-100 text-sm leading-relaxed">
          Every emission entry you log in KrishiCarbon AI is part of an <strong>immutable, timestamped ledger</strong>.
          This is the foundation for accessing voluntary carbon markets. When you reduce emissions using these
          suggestions, the difference between your baseline and new readings is your <strong>carbon reduction credit</strong>.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Voluntary Carbon Price', value: '₹500–₹2,000/tonne' },
            { label: 'Minimum Project Size', value: '~20 farmers pooled' },
            { label: 'Verification Standard', value: 'IPCC Tier 1 ✓' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-emerald-300 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-emerald-300 mt-2">
          Source: Gold Standard, Verra VCS, India Carbon Market guidelines
        </p>
      </section>

    </div>
  );
}
