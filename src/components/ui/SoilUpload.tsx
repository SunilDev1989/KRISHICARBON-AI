'use client';
import { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, FileText, Loader2, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFarm } from '@/context/FarmContext';
import { cn } from '@/lib/utils';

interface SoilResult {
  soc: number | null;
  nitrogen: number | null;
  ph: number | null;
  bulkDensity: number | null;
  storageUrl?: string;
}

interface SoilUploadProps {
  onResult?: (result: SoilResult) => void;
}

export default function SoilUpload({ onResult }: SoilUploadProps) {
  const { t } = useLanguage();
  const { farmId, updateSoilMetrics } = useFarm();
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SoilResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const pendingFileRef = useRef<{ base64: string; mimeType: string } | null>(null);

  const runExtraction = useCallback(async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('imageBase64', base64);
      fd.append('mimeType', mimeType);
      fd.append('farmId', farmId);

      const res = await fetch('/api/extract-soil', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        setResult(data);
        onResult?.(data);
      } else {
        setError((data.error ?? 'Extraction failed.') + (data.detail ? ` — ${data.detail}` : ''));
      }
    } catch {
      setError('Failed to connect to AI service. Check your internet connection.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [farmId, onResult]);

  const processFile = useCallback((file: File) => {
    setError(null);
    setResult(null);
    setSaved(false);
    setFileName(file.name);
    const mimeType = file.type || 'image/jpeg';
    setFileMime(mimeType);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      // For images: show preview. For PDFs: just show filename.
      setPreview(mimeType === 'application/pdf' ? 'pdf' : dataUrl);
      pendingFileRef.current = { base64, mimeType };
      // Auto-analyze images immediately; PDFs need the explicit button click
      if (mimeType !== 'application/pdf') {
        runExtraction(base64, mimeType);
      }
    };
    reader.readAsDataURL(file);
  }, [runExtraction]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const saveToLedger = () => {
    if (!result) return;
    updateSoilMetrics({
      soc: result.soc,
      nitrogen: result.nitrogen,
      ph: result.ph,
      bulkDensity: result.bulkDensity,
    });
    setSaved(true);
  };

  const metrics = result ? [
    { key: 'verify.result_soc', val: result.soc, unit: '%', color: 'emerald' },
    { key: 'verify.result_n', val: result.nitrogen, unit: 'kg/ha', color: 'blue' },
    { key: 'verify.result_ph', val: result.ph, unit: '', color: 'amber' },
    { key: 'verify.result_bd', val: result.bulkDensity, unit: 'g/cm³', color: 'orange' },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-emerald-500 bg-emerald-50 scale-[1.02]'
            : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
        )}
        onClick={() => document.getElementById('soil-file-input')?.click()}
      >
        <input
          id="soil-file-input"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        {preview ? (
          <div className="flex items-center justify-center gap-3">
            {fileMime === 'application/pdf'
              ? <FileText className="w-8 h-8 text-red-500" />
              : <FileImage className="w-8 h-8 text-emerald-600" />}
            <span className="text-sm font-medium text-emerald-700 truncate max-w-[200px]">{fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null); setResult(null);
                setFileName(null); pendingFileRef.current = null;
              }}
              className="text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">{t('verify.upload_label')}</p>
            <p className="text-xs text-gray-400 mt-1">Click to browse or drag & drop</p>
          </>
        )}
      </div>

      {/* Analyze Button — shown for PDFs (images auto-analyze on load) */}
      {preview && !result && (
        <button
          onClick={() => {
            if (pendingFileRef.current && !isAnalyzing) {
              runExtraction(pendingFileRef.current.base64, pendingFileRef.current.mimeType);
            }
          }}
          disabled={isAnalyzing}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('verify.analyzing')}</>
          ) : (
            <>{fileMime === 'application/pdf' ? '📄 Analyze PDF with Gemini AI' : t('verify.upload_btn')}</>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800">AI Extraction Complete</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map(({ key, val, unit, color }) => (
              <div key={key} className={cn(
                'p-3 rounded-xl border',
                color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
                color === 'blue' ? 'bg-blue-50 border-blue-200' :
                color === 'amber' ? 'bg-amber-50 border-amber-200' :
                'bg-orange-50 border-orange-200'
              )}>
                <p className="text-xs text-gray-500">{t(key)}</p>
                <p className="text-xl font-bold text-gray-800">
                  {val !== null ? `${val}${unit}` : '—'}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={saveToLedger}
            disabled={saved}
            className={cn(
              'w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
              saved
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
          >
            {saved ? <><CheckCircle className="w-4 h-4" />{t('verify.saved')}</> : t('verify.save_ledger')}
          </button>
        </div>
      )}
    </div>
  );
}
