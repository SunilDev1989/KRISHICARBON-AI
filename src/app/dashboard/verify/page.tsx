'use client';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import SoilUpload from '@/components/ui/SoilUpload';
import VoiceRecorder from '@/components/ui/VoiceRecorder';
import { FlaskConical, Mic, Upload, BookOpen, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveTab = 'lab' | 'voice';

export default function VerifyPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('lab');
  const [voiceResult, setVoiceResult] = useState<any>(null);

  const tabs = [
    { id: 'lab' as ActiveTab, icon: Upload, label: t('verify.lab_tab') },
    { id: 'voice' as ActiveTab, icon: Mic, label: t('verify.voice_tab') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-blue-600" />
          {t('verify.title')}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">{t('verify.how_it_works')}</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <strong>How it works:</strong> Upload your soil lab report image/PDF for instant AI extraction of SOC, Nitrogen, pH, and Bulk Density values — or speak in Hindi/Gujarati to log a field operation, and Gemini will convert it to a structured data entry.
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
              activeTab === id
                ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Main Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            {activeTab === 'lab' ? (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-5">
                  🔬 {t('verify.lab_tab')}
                </h2>
                <SoilUpload />
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-5">
                  🎤 {t('verify.voice_tab')}
                </h2>
                <VoiceRecorder onResult={setVoiceResult} />

                {/* Voice to Emission Action */}
                {voiceResult?.action === 'fertilizer_application' && (
                  <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-sm font-semibold text-emerald-700 mb-2">
                      ✅ Fertilizer detected — auto-fill emission form?
                    </p>
                    <a
                      href={`/dashboard/ledger?type=${voiceResult.type}&mass=${voiceResult.quantity_kg}`}
                      className="inline-block text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Open Emission Form →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar: Process Guide */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-200 p-5">
            <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> How AI Extraction Works
            </h3>
            <ol className="space-y-3 text-sm">
              {[
                { step: '1', text: 'Upload a photo or PDF scan of your soil lab report', icon: '📄' },
                { step: '2', text: 'Gemini 1.5 Flash Vision reads and parses the document', icon: '🤖' },
                { step: '3', text: 'SOC, N, pH, and Bulk Density values are extracted as structured JSON', icon: '📊' },
                { step: '4', text: 'Raw report is stored in Firebase Storage with a permanent URL', icon: '☁️' },
                { step: '5', text: 'Extracted values sync to your dashboard soil metrics', icon: '✅' },
              ].map(({ step, text, icon }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center">{step}</span>
                  <span className="text-blue-700">{icon} {text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Supported Formats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-3">{t('verify.input_formats')}</h4>
            <div className="flex flex-wrap gap-2">
              {['JPG / JPEG', 'PNG', 'WebP', 'PDF (image)'].map((fmt) => (
                <span key={fmt} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{fmt}</span>
              ))}
            </div>
          </div>

          {/* Extracted Parameters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-3">{t('verify.extracted_params')}</h4>
            <div className="space-y-2">
              {[
                { label: 'SOC', full: 'Soil Organic Carbon', unit: '%', color: 'emerald' },
                { label: 'N', full: 'Total / Available Nitrogen', unit: 'kg/ha', color: 'blue' },
                { label: 'pH', full: 'Soil pH (water / CaCl₂)', unit: '0–14', color: 'amber' },
                { label: 'BD', full: 'Bulk Density', unit: 'g/cm³', color: 'orange' },
              ].map(({ label, full, unit, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className={cn(
                    'font-mono font-bold text-xs w-8',
                    color === 'emerald' ? 'text-emerald-700' :
                    color === 'blue' ? 'text-blue-700' :
                    color === 'amber' ? 'text-amber-700' : 'text-orange-700'
                  )}>{label}</span>
                  <span className="text-gray-600 flex-1 mx-2">{full}</span>
                  <span className="text-xs text-gray-400">{unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
