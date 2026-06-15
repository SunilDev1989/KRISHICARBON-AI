'use client';
import { useState } from 'react';
import { Beaker, Leaf, CheckCircle, Loader2, Calculator } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="IPCC Tier 1 Emission Calculator">

      {/* Fertilizer Type — accessible group */}
      <fieldset>
        <legend className="block text-sm font-semibold text-gray-700 mb-2">
          <Beaker className="w-4 h-4 inline mr-1" aria-hidden="true" />
          {t('emission.fertilizer_type')}
        </legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select fertilizer type">
          {fertOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={fertType === opt.value}
              onClick={() => setFertType(opt.value)}
              className={cn(
                'py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1',
                fertType === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50'
              )}
            >
              <span className="text-xl" aria-hidden="true">{opt.icon}</span>
              <span className="text-xs leading-tight text-center">{opt.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Mass Input — explicit label with htmlFor */}
      <div>
        <label htmlFor="fertilizer-mass" className="block text-sm font-semibold text-gray-700 mb-1.5">
          {t('emission.mass_kg')} <span className="text-gray-400 font-normal">(kg)</span>
        </label>
        <div className="relative">
          <input
            id="fertilizer-mass"
            type="number"
            min="0.1"
            max="100000"
            step="0.1"
            value={massKg}
            onChange={(e) => setMassKg(e.target.value)}
            placeholder="e.g. 100"
            required
            aria-required="true"
            aria-describedby="mass-hint"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium" aria-hidden="true">kg</span>
        </div>
        <p id="mass-hint" className="text-xs text-gray-400 mt-1">Enter the applied mass of fertilizer in kilograms</p>
      </div>

      {/* Crop Residue Toggle */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <label htmlFor="include-residue" className="flex items-center gap-3 cursor-pointer">
          <input
            id="include-residue"
            type="checkbox"
            checked={includeResidue}
            onChange={(e) => setIncludeResidue(e.target.checked)}
            className="w-5 h-5 rounded accent-emerald-600 focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-sm font-semibold text-amber-800 flex items-center gap-1">
            <Leaf className="w-4 h-4" aria-hidden="true" /> {t('emission.residue_type')} (optional)
          </span>
        </label>

        {includeResidue && (
          <div className="mt-4 space-y-3" role="group" aria-label="Crop residue details">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Residue management method">
              {(['Burning', 'Mulching'] as ResidueType[]).map((rt) => (
                <button
                  key={rt}
                  type="button"
                  role="radio"
                  aria-checked={residueType === rt}
                  onClick={() => setResidueType(rt)}
                  className={cn(
                    'py-2.5 rounded-xl border-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    residueType === rt
                      ? rt === 'Burning'
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <span aria-hidden="true">{rt === 'Burning' ? '🔥 ' : '🌱 '}</span>
                  {t(`emission.${rt.toLowerCase()}` as never)}
                </button>
              ))}
            </div>

            <label htmlFor="residue-mass" className="sr-only">Residue mass in kilograms</label>
            <input
              id="residue-mass"
              type="number"
              min="0.1"
              max="100000"
              value={residueMass}
              onChange={(e) => setResidueMass(e.target.value)}
              placeholder="Residue mass (kg)"
              aria-label="Residue mass in kilograms"
              className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />

            <label htmlFor="crop-type" className="sr-only">Crop type</label>
            <select
              id="crop-type"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              aria-label="Select crop type for residue emission factor"
              className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 bg-white"
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
        aria-busy={loading}
        aria-label={loading ? 'Calculating emissions, please wait' : 'Calculate IPCC Tier 1 emissions'}
        className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {loading
          ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          : <Calculator className="w-5 h-5" aria-hidden="true" />
        }
        {loading ? t('common.loading') : t('emission.calculate')}
      </button>

      {/* Error — aria-live so screen readers announce it */}
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {error && (
          <p className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </p>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <section
          aria-label="Emission calculation result"
          aria-live="polite"
          className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5 space-y-4 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <span className="font-bold text-emerald-800">{t('emission.result')}</span>
            {saved && <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t('emission.saved')}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-gray-400">N₂O Emitted</p>
              <p className="text-2xl font-bold text-amber-700">
                {result.n2o_kg.toFixed(4)}<span className="text-sm ml-1 text-gray-500">kg</span>
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-gray-400">CO₂e</p>
              <p className="text-2xl font-bold text-red-600">
                {result.co2e_kg.toFixed(2)}<span className="text-sm ml-1 text-gray-500">kg</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTrace(!showTrace)}
            aria-expanded={showTrace}
            aria-controls="formula-trace"
            className="text-xs text-emerald-600 hover:text-emerald-800 underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
          >
            {showTrace ? 'Hide' : 'Show'} IPCC formula trace
          </button>
          {showTrace && (
            <pre
              id="formula-trace"
              className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap font-mono border border-gray-200"
              aria-label="IPCC Tier 1 formula calculation trace"
            >
              {result.formula_trace}
            </pre>
          )}
        </section>
      )}
    </form>
  );
}
