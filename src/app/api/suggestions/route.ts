/**
 * POST /api/suggestions
 *
 * Generates personalised, IPCC-grounded carbon reduction suggestions
 * using Gemini AI. The prompt is seeded with the farmer's actual
 * emission records so suggestions are specific, not generic.
 *
 * Returns 5 structured suggestions ranked by CO₂e savings potential.
 */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

interface EmissionSummary {
  fertilizerType?: string;
  massKg?: number;
  residueType?: string;
  totalCo2eKg?: number;
  monthlyRecords?: number;
  lang?: string;
}

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  gu: 'Gujarati',
  ta: 'Tamil',
  mr: 'Marathi',
};

/**
 * Generate personalised IPCC-grounded carbon reduction suggestions via Gemini AI.
 *
 * @param req - JSON body conforming to EmissionSummary (fertilizerType, massKg, etc.)
 * @returns Array of 5 ranked Suggestion objects, model used, and success flag
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: EmissionSummary = await req.json();

    const {
      fertilizerType = 'Urea',
      massKg = 0,
      residueType = 'unknown',
      totalCo2eKg = 0,
      monthlyRecords = 0,
      lang = 'en',
    } = body;

    const languageName = LANG_NAMES[lang] ?? 'English';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service unavailable.' }, { status: 503 });
    }

    const prompt = `You are an expert agricultural carbon advisor helping Indian smallholder farmers reduce their carbon footprint and access carbon credit markets.

FARMER'S CURRENT DATA:
- Primary fertilizer used: ${fertilizerType}
- Average application: ${massKg} kg per session
- Crop residue management: ${residueType}
- Total logged CO₂e this month: ${totalCo2eKg.toFixed(1)} kg
- Emission records logged: ${monthlyRecords}

Generate exactly 5 personalised, actionable carbon reduction suggestions for this farmer.

IMPORTANT RULES:
1. Each suggestion must be specific to Indian smallholder farming conditions
2. Include estimated CO₂e savings in kg per season where possible (use IPCC Tier 1 estimates)
3. Prioritise suggestions that are free or very low cost (≤ ₹2,000)
4. Rank by CO₂e savings potential (highest first)
5. Use simple, practical language a farmer with basic education can understand
6. Include at least one suggestion about soil carbon sequestration
7. LANGUAGE: Write the "title", "description", and "ipccBasis" fields in ${languageName}.
   Keep these fields in English exactly as specified (they are enum values): "category", "costLevel", "timeToImpact".

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
{
  "rank": number (1-5),
  "title": string (max 8 words, in ${languageName}),
  "description": string (2-3 sentences, practical steps, in ${languageName}),
  "co2eSavingKgPerSeason": number (estimated),
  "costLevel": "Free" | "Low (₹500-2000)" | "Medium (₹2000-10000)",
  "timeToImpact": "Immediate" | "1 Season" | "1-2 Years",
  "category": "Fertilizer" | "Residue" | "Soil" | "Water" | "Energy" | "Agroforestry",
  "ipccBasis": string (1 sentence citing IPCC guideline, in ${languageName})
}`;

    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
          model,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        });

        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text().trim();

        // Extract JSON array from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON array in Gemini response');

        const suggestions = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
          throw new Error('Invalid suggestions format');
        }

        return NextResponse.json({ suggestions, model, success: true });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    // All models failed — return static fallback suggestions
    return NextResponse.json({
      suggestions: getStaticSuggestions(fertilizerType, residueType),
      model: 'static-fallback',
      success: true,
    });

  } catch (e) {
    console.error('Suggestions API error:', e);
    return NextResponse.json(
      { error: 'Failed to generate suggestions.' },
      { status: 500 }
    );
  }
}

/** IPCC-grounded static fallback when Gemini is unavailable */
function getStaticSuggestions(fertilizerType: string, residueType: string) {
  const suggestions = [
    {
      rank: 1,
      title: 'Switch to Neem-Coated Urea',
      description:
        'Neem-coated urea slows nitrogen release, reducing N₂O emissions by 20–30% compared to plain urea. Apply at the same rate as regular urea. Available at most cooperative stores at similar price.',
      co2eSavingKgPerSeason: 59,
      costLevel: 'Free',
      timeToImpact: 'Immediate',
      category: 'Fertilizer',
      ipccBasis: 'IPCC 2006 GL Vol 4 Ch 11: nitrification inhibitors reduce EF1 by 20-30%.',
    },
    {
      rank: 2,
      title: 'Stop Burning — Mulch Crop Residue',
      description:
        'Instead of burning stubble, incorporate it into the soil or leave as mulch. Burning 1 tonne of wheat residue releases ~1,520 kg CO₂e. Mulching also improves soil organic matter and reduces irrigation need.',
      co2eSavingKgPerSeason: residueType === 'Burning' ? 760 : 200,
      costLevel: 'Free',
      timeToImpact: 'Immediate',
      category: 'Residue',
      ipccBasis: 'IPCC 2006 GL Vol 4 Table 2.5: crop residue burning EF = 1.47-1.58 kg CO₂e/kg.',
    },
    {
      rank: 3,
      title: 'Apply Biochar to Improve Soil Carbon',
      description:
        'Adding 1 tonne of biochar per hectare sequesters 2–3 tonnes CO₂e long-term and improves water retention. Make biochar from agricultural waste using a simple kiln. Lasts 100+ years in soil.',
      co2eSavingKgPerSeason: 2000,
      costLevel: 'Low (₹500-2000)',
      timeToImpact: '1 Season',
      category: 'Soil',
      ipccBasis: 'IPCC AR6 Ch 7: biochar application has high permanence carbon sequestration potential.',
    },
    {
      rank: 4,
      title: 'Plant Trees on Field Borders (Agroforestry)',
      description:
        'Planting native trees like Neem, Pongamia, or Moringa on 5% of farm area sequesters 500–2,000 kg CO₂e per year depending on species. Trees also provide shade, fodder, and income.',
      co2eSavingKgPerSeason: 500,
      costLevel: 'Free',
      timeToImpact: '1-2 Years',
      category: 'Agroforestry',
      ipccBasis: 'IPCC 2006 GL Vol 4 Ch 6: agroforestry systems significant carbon stock changes.',
    },
    {
      rank: 5,
      title: 'Split Fertilizer Applications',
      description:
        'Apply fertilizer in 2–3 small doses instead of one large application. This reduces peak N₂O emissions by 15–20% as soil microbes process smaller nitrogen loads. No extra cost — just change timing.',
      co2eSavingKgPerSeason: 40,
      costLevel: 'Free',
      timeToImpact: 'Immediate',
      category: 'Fertilizer',
      ipccBasis: 'IPCC 2006 GL Vol 4 Ch 11: application timing affects N₂O emission pulse patterns.',
    },
  ];

  return suggestions;
}
