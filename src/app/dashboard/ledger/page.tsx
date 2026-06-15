'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useFarm } from '@/context/FarmContext';
import EmissionForm from '@/components/ui/EmissionForm';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { BookOpen, Download, Filter, Leaf, BarChart3, Flame } from 'lucide-react';

interface EmissionLog {
  id: string;
  timestamp: { seconds: number } | null;
  fertilizerType: string | null;
  massKg: number | null;
  residueType: string | null;
  n2o_kg: number;
  co2e_kg: number;
  cropType: string | null;
}

export default function LedgerPage() {
  const { t } = useLanguage();
  const { farmId } = useFarm();
  const [logs, setLogs] = useState<EmissionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Urea' | 'DAP' | 'NPK' | 'Burning'>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'emissionLogs'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmissionLog[];
        setLogs(items);
      } catch (e) {
        console.error('Firestore fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [farmId]);

  const filtered = filter === 'all'
    ? logs
    : logs.filter((l) => l.fertilizerType === filter || l.residueType === filter);

  const totalCo2e = filtered.reduce((s, l) => s + (l.co2e_kg ?? 0), 0);

  const exportCsv = () => {
    const header = 'Date,Type,Mass(kg),N2O(kg),CO2e(kg),Residue,Crop\n';
    const rows = filtered.map((l) => [
      l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleDateString() : '—',
      l.fertilizerType ?? 'N/A',
      l.massKg ?? 0,
      l.n2o_kg,
      l.co2e_kg,
      l.residueType ?? 'N/A',
      l.cropType ?? 'N/A',
    ].join(',')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishicarbon_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterOptions = [
    { value: 'all', label: 'All Entries' },
    { value: 'Urea', label: 'Urea' },
    { value: 'DAP', label: 'DAP' },
    { value: 'NPK', label: 'NPK' },
    { value: 'Burning', label: 'Burning' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-emerald-600" />{t('ledger.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">IPCC Tier 1 certified emission records from Firestore</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />{t('ledger.export')}
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-red-700">{totalCo2e.toFixed(2)}</p>
          <p className="text-xs text-red-500 font-medium">Total CO₂e (kg)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-700">{filtered.length}</p>
          <p className="text-xs text-amber-500 font-medium">Total Entries</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">
            {filtered.reduce((s, l) => s + (l.n2o_kg ?? 0), 0).toFixed(3)}
          </p>
          <p className="text-xs text-emerald-500 font-medium">Total N₂O (kg)</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">{t('ledger.filter')}:</span>
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="space-y-2 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">{t('ledger.no_records')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[t('ledger.date'), t('ledger.type'), t('ledger.mass'), t('ledger.n2o'), t('ledger.co2e'), t('ledger.source')].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {log.fertilizerType ? (
                          <><Leaf className="w-3.5 h-3.5 text-emerald-500" /><span className="font-medium text-emerald-800">{log.fertilizerType}</span></>
                        ) : (
                          <><Flame className="w-3.5 h-3.5 text-red-500" /><span className="font-medium text-red-700">Residue</span></>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{log.massKg ?? '—'} kg</td>
                    <td className="px-4 py-3 font-mono text-amber-700 font-medium">{log.n2o_kg?.toFixed(4)}</td>
                    <td className="px-4 py-3 font-mono text-red-600 font-bold">{log.co2e_kg?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">Firestore</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Emission Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-5">Add New Emission Entry</h2>
        <EmissionForm />
      </div>
    </div>
  );
}
