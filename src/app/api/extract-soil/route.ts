import { NextRequest, NextResponse } from 'next/server';
import { genAI, GEMINI_MODEL, GEMINI_MODEL_FALLBACKS, GEMINI_REQUEST_OPTIONS } from '@/lib/gemini';
import { storage, db } from '@/config/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Soil lab report extraction via Gemini 1.5 Flash (v1 endpoint).
 *
 * Both images (JPEG/PNG/WebP) and PDFs are passed as inlineData.
 * The Gemini v1 API supports application/pdf via inlineData directly.
 *
 * NOTE: The Files API (fileData / fileUri) is a v1beta-only feature and
 * cannot be used when apiVersion = 'v1'.
 */

const SOIL_EXTRACTION_PROMPT = `You are an expert agricultural soil scientist and data extractor.
Analyze this soil laboratory test report carefully — it may be an image or a multi-page PDF document.
Extract ONLY the following key parameters from any tables, text, or lab values visible:
- SOC (Soil Organic Carbon) in percentage (%)
- Nitrogen (Total Nitrogen or Available Nitrogen) in kg/ha or %
- pH value (water or CaCl2)
- Bulk Density in g/cm³

Return ONLY a valid JSON object with no markdown, no explanation, no extra text:
{"soc": <number_or_null>, "nitrogen": <number_or_null>, "ph": <number_or_null>, "bulkDensity": <number_or_null>}

If a value is not found in the report, use null. Never hallucinate values.`;

const SUPPORTED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileBase64 = formData.get('imageBase64') as string;
    const mimeType = (formData.get('mimeType') as string) ?? 'image/jpeg';
    const farmId = (formData.get('farmId') as string) ?? 'default';

    if (!fileBase64) {
      return NextResponse.json({ error: 'No file data provided.' }, { status: 400 });
    }

    // Security: reject files over 10 MB (base64 of 10MB ≈ 13.6M chars)
    if (fileBase64.length > 13_600_000) {
      return NextResponse.json({
        error: 'File too large. Maximum allowed size is 10 MB.',
      }, { status: 413 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured on server.' }, { status: 500 });
    }

    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({
        error: `Unsupported file type: ${mimeType}. Use JPEG, PNG, WebP, or PDF.`,
      }, { status: 400 });
    }

    // ── Gemini call with automatic model fallback on 429 quota errors ──
    let result;
    let lastError: string = '';
    const modelsToTry = GEMINI_MODEL_FALLBACKS.length > 0 ? GEMINI_MODEL_FALLBACKS : [GEMINI_MODEL];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName }, GEMINI_REQUEST_OPTIONS);
        result = await model.generateContent([
          SOIL_EXTRACTION_PROMPT,
          { inlineData: { mimeType, data: fileBase64 } },
        ]);
        break; // success — stop trying
      } catch (modelErr: unknown) {
        lastError = modelErr instanceof Error ? modelErr.message : String(modelErr);
        const is429 = lastError.includes('429') || lastError.includes('quota') || lastError.includes('Too Many Requests');
        const is404 = lastError.includes('404') || lastError.includes('not found');
        if (is429 || is404) {
          console.warn(`Model ${modelName} unavailable (${is429 ? '429 quota' : '404'}), trying next...`);
          continue; // try next model
        }
        throw modelErr; // non-quota error — rethrow immediately
      }
    }

    if (!result) {
      return NextResponse.json({
        error: 'All Gemini models are currently at quota limit. Please try again in a few minutes.',
        detail: lastError,
      }, { status: 503 });
    }

    const text = result.response.text().trim();

    // Strip any accidental markdown code fences Gemini may add
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Gemini returned an unparseable response. Try a clearer image.',
        raw: text.slice(0, 500),
      }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      soc: number | null;
      nitrogen: number | null;
      ph: number | null;
      bulkDensity: number | null;
    };

    // ── Upload original file to Firebase Storage (non-fatal) ───────────
    let storageUrl: string | null = null;
    try {
      const ext = mimeType === 'application/pdf' ? 'pdf'
        : mimeType === 'image/png' ? 'png'
        : mimeType === 'image/webp' ? 'webp'
        : 'jpg';
      const storageRef = ref(storage, `soilReports/${farmId}/${Date.now()}.${ext}`);
      await uploadString(storageRef, fileBase64, 'base64', { contentType: mimeType });
      storageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'soilLedgers'), {
        farmId,
        storageUrl,
        fileType: mimeType,
        extractedMetrics: parsed,
        timestamp: serverTimestamp(),
      });
    } catch (storageErr) {
      // Non-fatal — extraction succeeded; only storage/Firestore failed
      console.error('Storage/Firestore error (non-fatal):', storageErr);
    }

    return NextResponse.json({ ...parsed, storageUrl, success: true });

  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('Soil extraction error:', errMsg);
    return NextResponse.json({
      error: 'Gemini extraction failed.',
      detail: errMsg,
    }, { status: 500 });
  }
}
