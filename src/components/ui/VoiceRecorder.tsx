'use client';
import { useState } from 'react';
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface VoiceResult {
  action: string;
  type: string;
  quantity_kg: number | null;
  unit: string;
  crop: string | null;
  raw_transcript: string;
  confidence: string;
}

interface VoiceRecorderProps {
  onResult?: (result: VoiceResult) => void;
}

export default function VoiceRecorder({ onResult }: VoiceRecorderProps) {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await analyzeAudio(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch {
      setError('Microphone access denied. Please allow microphone in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsAnalyzing(true);
    }
  };

  const analyzeAudio = async (blob: Blob) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const fd = new FormData();
        fd.append('audioBase64', base64);
        fd.append('mimeType', 'audio/webm');

        const res = await fetch('/api/voice-intent', { method: 'POST', body: fd });
        const data = await res.json();

        if (data.success) {
          setResult(data);
          onResult?.(data);
        } else {
          setError(data.error ?? 'Analysis failed.');
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setError('Audio processing failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isAnalyzing}
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 select-none',
            isRecording
              ? 'bg-red-500 scale-110 shadow-red-200 shadow-xl animate-pulse'
              : isAnalyzing
              ? 'bg-amber-100 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 cursor-pointer'
          )}
        >
          {isAnalyzing ? (
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          ) : isRecording ? (
            <Square className="w-10 h-10 text-white fill-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>
        <p className="text-sm font-medium text-gray-600">
          {isRecording
            ? t('verify.recording')
            : isAnalyzing
            ? t('verify.analyzing')
            : t('verify.record_btn')}
        </p>
        <p className="text-xs text-gray-400 text-center max-w-xs">{t('verify.voice_hint')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800">Voice Intent Extracted</span>
            <span className={cn(
              'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
              result.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
              result.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {result.confidence} confidence
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Action', result.action?.replace(/_/g, ' ')],
              ['Type', result.type],
              ['Quantity', result.quantity_kg ? `${result.quantity_kg} kg` : '—'],
              ['Crop', result.crop ?? '—'],
            ].map(([label, val]) => (
              <div key={label} className="bg-white rounded-lg p-2 border border-emerald-100">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-semibold text-gray-800 capitalize">{val}</p>
              </div>
            ))}
          </div>
          {result.raw_transcript && (
            <p className="text-xs text-gray-500 italic border-t border-emerald-100 pt-2">
              &ldquo;{result.raw_transcript}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
