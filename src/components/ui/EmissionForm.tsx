'use client';
import { useState } from 'react';
import { Beaker, Leaf, TreePine, CheckCircle, Loader2, Calculator } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFarm } from '@/context/FarmContext';
import { cn } from '@/lib/utils';

type FertilizerType = 'Urea' | 'DAP' | 'NPK';
type ResidueType = 'Burning' | 'Mulching';

interface EmissionResult {
  n2o_kg: number;
  co2e_kg: number;
  formula_trace: string;
  id?: string;
}

export default function EmissionForm() {
  const { t } = useLanguage();
  const { farmId, updateCarbonTotals } = useFarm();
  const [fertType, setFertType] = useState<FertilizerType>('Urea');
  const [massKg, setMassKg] = useState('');
  const [residueType, setResidueType] = useState<ResidueType>('Mulching');
  const [residueMass, setResidueMass] = useState('');
  const [cropType, setCropType] = useState('wheat');
  const [includeResidue, setIncludeResidue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmissionResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const fertOptions: { value: FertilizerType; label: string; icon: string }[] = [
    { value: 'Urea', label: t('emission.urea'), icon: '🌿' },
    { value: 'DAP', label: t('emission.dap'), icon: '⚗️' },
    { value: 'NPK', label: t('emission.npk'), icon: '🔬' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSaved(false);
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        farmId,
        fertilizerType: fertType,
        massKg: parseFloat(massKg) || 0,
      };
      if (includeResidue && residueMass) {
        body.residueType = residueType;
        body.residueMassKg = parseFloat(residueMass);
        body.cropType = cropType;
      }

      const res = await fetch('/api/compute-emissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.co2e_kg !== undefined) {
        setResult(data);
        setSaved(true);
        const month = new Date().toISOString().slice(0, 7);
        updateCarbonTotals({ month, co2e_kg: data.co2e_kg });
      } else {
        setError(data.error ?? 'Calculation failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fertilizer Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Beaker className="w-4 h-4 inline mr-1" />{t('emission.fertilizer_type')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {fertOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFertType(opt.value)}
              className={cn(
                'py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-1',
                fertType === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50'
              )}
            >
              <span className="text-xl">{opt.icon}</span>
              <span className="text-xs leading-tight text-center">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mass Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {t('emission.mass_kg')}
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.1"
            value={massKg}
            onChange={(e) => setMassKg(e.target.value)}
            placeholder="e.g. 100"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-emerald-500 transition-colors pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">kg</span>
        </div>
      </div>

      {/* Crop Residue Toggle */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeResidue}
            onChange={(e) => setIncludeResidue(e.target.checked)}
            className="w-5 h-5 rounded accent-emerald-600"
          />
          <span className="text-sm font-semibold text-amber-800 flex items-center gap-1">
            <Leaf className="w-4 h-4" /> {t('emission.residue_type')} (optional)
          </span>
        </label>

        {includeResidue && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(['Burning', 'Mulching'] as ResidueType[]).map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setResidueType(rt)}
                  className={cn(
                    'py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                    residueType === rt
                      ? rt === 'Burning'
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {rt === 'Burning' ? '🔥 ' : '🌱 '}{t(`emission.${rt.toLowerCase()}` as any)}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              value={residueMass}
              onChange={(e) => setResidueMass(e.target.value)}
              placeholder="Residue mass (kg)"
              className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
            />
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white"
            >
              {['wheat', 'rice', 'maize', 'sugarcane', 'other'].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !massKg}
        className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.99]"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
        {loading ? t('common.loading') : t('emission.calculate')}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-emerald-800">{t('emission.result')}</span>
            {saved && <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t('emission.saved')}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-gray-400">N₂O Emitted</p>
              <p className="text-2xl font-bold text-amber-700">{result.n2o_kg.toFixed(4)}<span className="text-sm ml-1 text-gray-500">kg</span></p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-gray-400">CO₂e</p>
              <p className="text-2xl font-bold text-red-600">{result.co2e_kg.toFixed(2)}<span className="text-sm ml-1 text-gray-500">kg</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTrace(!showTrace)}
            className="text-xs text-emerald-600 hover:text-emerald-800 underline"
          >
            {showTrace ? 'Hide' : 'Show'} IPCC formula trace
          </button>
          {showTrace && (
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap font-mono border border-gray-200">
              {result.formula_trace}
            </pre>
          )}
        </div>
      )}
    </form>
  );
}
