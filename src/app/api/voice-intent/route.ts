/**
 * POST /api/voice-intent
 *
 * Transcribes and semantically parses regional-language farmer voice recordings
 * using Gemini multimodal AI. Accepts audio as base64-encoded inline data.
 *
 * Supported languages: Hindi, Gujarati, Tamil, Marathi, English.
 * Supported audio formats: audio/webm, audio/ogg, audio/mp4, audio/wav.
 *
 * Returns a structured JSON intent object describing the detected farm operation
 * (e.g. fertilizer application, irrigation, residue management).
 */
import { NextRequest, NextResponse } from 'next/server';
import { genAI, GEMINI_MODEL, GEMINI_REQUEST_OPTIONS } from '@/lib/gemini';

const VOICE_INTENT_PROMPT = `You are an agricultural field operations assistant for Indian farmers.
The following audio contains a farmer describing a farm activity in Hindi, Gujarati, or English.
Extract the structured operational intent and return ONLY a valid JSON object.

Possible action types: "fertilizer_application", "residue_management", "irrigation", "pesticide_application", "harvest", "soil_sampling", "other"

JSON format (return ONLY this, no markdown, no explanation):
{
  "action": "<action_type>",
  "type": "<specific_input_type_if_applicable>",
  "quantity_kg": <number_or_null>,
  "unit": "<kg|litre|bag|null>",
  "crop": "<crop_name_or_null>",
  "field_area_acres": <number_or_null>,
  "raw_transcript": "<your_transcription_of_the_audio>",
  "confidence": "<high|medium|low>"
}

Examples:
- "मैंने आज खेत में दो बोरी यूरिया डाला" → {"action":"fertilizer_application","type":"Urea","quantity_kg":100,"unit":"bag","crop":null,"field_area_acres":null,"raw_transcript":"...","confidence":"high"}
- "આજે મેં ડ્રિપ સિંચાઈ ચલાવી" → {"action":"irrigation","type":"drip","quantity_kg":null,"unit":null,"crop":null,"field_area_acres":null,"raw_transcript":"...","confidence":"high"}`;

/**
 * Parse a farmer voice recording and extract a structured farm operation intent.
 *
 * @param req - FormData with `audioBase64` (base64 string) and optional `mimeType`
 * @returns JSON object with action, type, quantity_kg, unit, crop, confidence, and raw_transcript
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const audioBase64 = formData.get('audioBase64') as string;
    const mimeType = (formData.get('mimeType') as string) ?? 'audio/webm';

    if (!audioBase64) {
      return NextResponse.json({ error: 'No audio data provided.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL }, GEMINI_REQUEST_OPTIONS);

    const result = await model.generateContent([
      VOICE_INTENT_PROMPT,
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Could not parse voice intent.',
        raw: text,
      }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ...parsed, success: true });
  } catch (e) {
    console.error('Voice intent error:', e);
    return NextResponse.json({ error: 'Voice processing failed.', detail: String(e) }, { status: 500 });
  }
}
