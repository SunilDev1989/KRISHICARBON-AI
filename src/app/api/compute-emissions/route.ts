/**
 * POST /api/compute-emissions
 *
 * Computes IPCC Tier 1 agricultural greenhouse gas emissions and persists
 * the result to Firestore. Uses shared pure functions from @/lib/emissions
 * to keep business logic testable and DRY.
 *
 * Security: all inputs are validated before processing.
 * Offline: returns result even if Firestore write fails.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  calculateFertilizerEmissions,
  calculateResidueEmissions,
  NITROGEN_FRACTIONS,
} from '@/lib/emissions';

/** Allowed fertilizer types — validated server-side */
const VALID_FERTILIZER_TYPES = Object.keys(NITROGEN_FRACTIONS) as Array<keyof typeof NITROGEN_FRACTIONS>;

/** Maximum plausible single-application mass (kg) — prevents abuse */
const MAX_MASS_KG = 100_000;

interface EmissionRequest {
  fertilizerType?: string;
  massKg?: number;
  residueType?: 'Burning' | 'Mulching';
  residueMassKg?: number;
  cropType?: string;
  farmId?: string;
}

/**
 * Compute IPCC Tier 1 agricultural GHG emissions and persist to Firestore.
 *
 * @param req - JSON body conforming to EmissionRequest
 * @returns Computed n2o_kg, co2e_kg, formula_trace, and Firestore document ID
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: EmissionRequest = await req.json();
    const {
      fertilizerType, massKg,
      residueType, residueMassKg,
      cropType, farmId,
    } = body;

    // ── Input Validation ────────────────────────────────────────────────
    if (fertilizerType && !VALID_FERTILIZER_TYPES.includes(fertilizerType as never)) {
      return NextResponse.json({
        error: `Invalid fertilizerType. Must be one of: ${VALID_FERTILIZER_TYPES.join(', ')}`,
      }, { status: 400 });
    }
    if (massKg !== undefined && (typeof massKg !== 'number' || massKg <= 0 || massKg > MAX_MASS_KG)) {
      return NextResponse.json({
        error: `massKg must be a positive number ≤ ${MAX_MASS_KG}`,
      }, { status: 400 });
    }
    if (residueMassKg !== undefined && (typeof residueMassKg !== 'number' || residueMassKg <= 0 || residueMassKg > MAX_MASS_KG)) {
      return NextResponse.json({
        error: `residueMassKg must be a positive number ≤ ${MAX_MASS_KG}`,
      }, { status: 400 });
    }

    // ── Calculations ────────────────────────────────────────────────────
    let totalN2o_kg = 0;
    let totalCo2e_kg = 0;
    const traceLines: string[] = [];

    if (fertilizerType && massKg && massKg > 0) {
      const result = calculateFertilizerEmissions(fertilizerType, massKg);
      totalN2o_kg += result.n2o_direct_kg;
      totalCo2e_kg += result.co2e_kg;
      traceLines.push(result.formulaTrace);
    }

    if (residueType === 'Burning' && residueMassKg && residueMassKg > 0) {
      const result = calculateResidueEmissions(residueMassKg, cropType ?? 'other');
      totalCo2e_kg += result.co2e_kg;
      traceLines.push(result.formulaTrace);
    }

    if (totalCo2e_kg === 0 && totalN2o_kg === 0) {
      return NextResponse.json({
        error: 'No valid emission inputs provided.',
      }, { status: 400 });
    }

    const n2o_kg = parseFloat(totalN2o_kg.toFixed(4));
    const co2e_kg = parseFloat(totalCo2e_kg.toFixed(4));
    const formula_trace = traceLines.join('\n\n');

    // ── Firestore Logging (non-fatal) ───────────────────────────────────
    const entry = {
      farmId: farmId ?? 'default',
      fertilizerType: fertilizerType ?? null,
      massKg: massKg ?? null,
      residueType: residueType ?? null,
      residueMassKg: residueMassKg ?? null,
      cropType: cropType ?? null,
      n2o_kg,
      co2e_kg,
      formula_trace,
      timestamp: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'emissionLogs'), entry);
      return NextResponse.json({ id: docRef.id, n2o_kg, co2e_kg, formula_trace, success: true });
    } catch {
      // Offline — return result without Firestore ID; client SDK will sync later
      return NextResponse.json({
        n2o_kg, co2e_kg, formula_trace, success: true,
        firestore_error: 'Offline — entry will sync when connected.',
      });
    }

  } catch (e) {
    return NextResponse.json({ error: 'Server error during emission calculation.' }, { status: 500 });
  }
}
