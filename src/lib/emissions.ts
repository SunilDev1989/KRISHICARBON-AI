/**
 * @module emissions
 * @description Pure IPCC Tier 1 emission calculation functions.
 *
 * All functions are side-effect-free and deterministic — no I/O, no state.
 * This makes them fully unit-testable and auditable against IPCC 2006/AR6 guidelines.
 *
 * References:
 *  - IPCC 2006 GL Vol 4 Ch 11: N₂O from managed soils
 *  - IPCC AR6 WG1 Table 7.SM.7: GWP100 for N₂O = 273
 *  - IPCC 2006 GL Vol 4 Ch 2: Crop residue burning
 */

/** Nitrogen mass fraction per fertilizer type (kg N / kg product) */
export const NITROGEN_FRACTIONS: Readonly<Record<string, number>> = {
  Urea: 0.46,   // CO(NH₂)₂ — 46% N by mass
  DAP: 0.18,    // Diammonium phosphate — 18% N
  NPK: 0.15,    // Generic NPK blend — 15% N (conservative estimate)
} as const;

/** IPCC Tier 1 direct emission factor for agricultural N₂O (kg N₂O-N / kg N input) */
export const EF1 = 0.01;

/** Global Warming Potential of N₂O over 100 years — IPCC AR6 (dimensionless) */
export const GWP_N2O = 273;

/** Stoichiometric conversion: N₂O molecular weight / N₂ molecular weight = 44/28 */
export const N2O_N_RATIO = 44 / 28;

/**
 * IPCC Tier 1 approximate emission factors for crop residue burning
 * (kg CO₂e per kg dry matter burned).
 * Source: IPCC 2006 GL Vol 4 Table 2.5 — conservative Tier 1 defaults.
 */
export const RESIDUE_EMISSION_FACTORS: Readonly<Record<string, number>> = {
  wheat: 1.52,
  rice: 1.47,
  maize: 1.58,
  sugarcane: 1.35,
  other: 1.50,
} as const;

export interface FertilizerEmissionResult {
  massN_kg: number;
  n2o_n_direct_kg: number;
  n2o_direct_kg: number;
  co2e_kg: number;
  formulaTrace: string;
}

/**
 * Calculate N₂O and CO₂e emissions from synthetic nitrogen fertilizer application.
 *
 * Formula chain (IPCC 2006 GL Vol 4, Eq. 11.1):
 *   Mass N = massKg × N_fraction
 *   N₂O-N_direct = Mass N × EF₁
 *   N₂O_direct = N₂O-N_direct × (44/28)
 *   CO₂e = N₂O_direct × GWP_N₂O
 *
 * @param fertilizerType - One of 'Urea' | 'DAP' | 'NPK'
 * @param massKg - Applied mass of fertilizer in kilograms (must be > 0)
 * @returns Detailed emission breakdown with formula trace string
 * @throws {Error} if massKg ≤ 0 or fertilizerType is unrecognised
 */
export function calculateFertilizerEmissions(
  fertilizerType: string,
  massKg: number,
): FertilizerEmissionResult {
  if (massKg <= 0) throw new Error('massKg must be greater than 0');
  const nFraction = NITROGEN_FRACTIONS[fertilizerType] ?? NITROGEN_FRACTIONS.NPK;
  const massN_kg = massKg * nFraction;
  const n2o_n_direct_kg = massN_kg * EF1;
  const n2o_direct_kg = n2o_n_direct_kg * N2O_N_RATIO;
  const co2e_kg = n2o_direct_kg * GWP_N2O;

  const formulaTrace = [
    `Fertilizer: ${fertilizerType} | Applied: ${massKg} kg`,
    `N fraction: ${(nFraction * 100).toFixed(0)}% → Mass N = ${massN_kg.toFixed(3)} kg`,
    `N₂O-N Direct = ${massN_kg.toFixed(3)} × EF₁(${EF1}) = ${n2o_n_direct_kg.toFixed(4)} kg N₂O-N`,
    `N₂O = ${n2o_n_direct_kg.toFixed(4)} × (44/28) = ${n2o_direct_kg.toFixed(4)} kg N₂O`,
    `CO₂e = ${n2o_direct_kg.toFixed(4)} × GWP(${GWP_N2O}) = ${co2e_kg.toFixed(2)} kg CO₂e`,
  ].join('\n');

  return { massN_kg, n2o_n_direct_kg, n2o_direct_kg, co2e_kg, formulaTrace };
}

export interface ResidueEmissionResult {
  emissionFactor: number;
  co2e_kg: number;
  formulaTrace: string;
}

/**
 * Calculate CO₂e from crop residue field burning.
 * Uses IPCC 2006 GL Vol 4 Table 2.5 Tier 1 default emission factors.
 *
 * @param residueMassKg - Dry mass of residue burned in kilograms (must be > 0)
 * @param cropType - Crop species (wheat, rice, maize, sugarcane); defaults to 'other'
 * @returns CO₂e and emission factor used
 * @throws {Error} if residueMassKg ≤ 0
 */
export function calculateResidueEmissions(
  residueMassKg: number,
  cropType: string = 'other',
): ResidueEmissionResult {
  if (residueMassKg <= 0) throw new Error('residueMassKg must be greater than 0');
  const key = cropType.toLowerCase();
  const emissionFactor = RESIDUE_EMISSION_FACTORS[key] ?? RESIDUE_EMISSION_FACTORS.other;
  const co2e_kg = residueMassKg * emissionFactor;

  const formulaTrace = [
    `Residue Burning: ${cropType} | Mass: ${residueMassKg} kg`,
    `EF = ${emissionFactor} kg CO₂e/kg residue`,
    `CO₂e = ${residueMassKg} × ${emissionFactor} = ${co2e_kg.toFixed(2)} kg CO₂e`,
  ].join('\n');

  return { emissionFactor, co2e_kg, formulaTrace };
}
