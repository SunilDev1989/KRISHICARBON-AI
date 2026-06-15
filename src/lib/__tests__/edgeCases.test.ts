/**
 * Extended edge case and boundary tests for climate risk & emissions.
 * Covers: extreme values, precision, boundary conditions, Indian agriculture context.
 */
import { describe, it, expect } from 'vitest';
import { calculateFertilizerEmissions, calculateResidueEmissions, NITROGEN_FRACTIONS, RESIDUE_EMISSION_FACTORS } from '../emissions';
import { checkReversalRisk, maxConsecutiveStressDays, HEAT_THRESHOLD_C, DROUGHT_THRESHOLD_GWET } from '../climateRisk';
import type { NasaDataPoint } from '@/context/FarmContext';

function pt(t2m_max: number, gwettop: number, date = '20260601'): NasaDataPoint {
  return { date, t2m_max, gwettop, prectot: 0 };
}

// ─── Boundary conditions ─────────────────────────────────────────────────────

describe('boundary conditions — threshold exactness', () => {
  it('exactly at heat threshold (38.0°C) does NOT trigger risk', () => {
    const data = [
      pt(HEAT_THRESHOLD_C, 0.1),
      pt(HEAT_THRESHOLD_C, 0.1),
      pt(HEAT_THRESHOLD_C, 0.1),
    ];
    expect(checkReversalRisk(data)).toBe(false); // must be strictly GREATER
  });

  it('1°C above threshold DOES trigger risk over 3 days', () => {
    const data = [
      pt(HEAT_THRESHOLD_C + 1, 0.1),
      pt(HEAT_THRESHOLD_C + 1, 0.1),
      pt(HEAT_THRESHOLD_C + 1, 0.1),
    ];
    expect(checkReversalRisk(data)).toBe(true);
  });

  it('exactly at drought threshold (0.25) does NOT trigger risk', () => {
    const data = [
      pt(40, DROUGHT_THRESHOLD_GWET),
      pt(40, DROUGHT_THRESHOLD_GWET),
      pt(40, DROUGHT_THRESHOLD_GWET),
    ];
    expect(checkReversalRisk(data)).toBe(false); // must be strictly LESS
  });

  it('one unit below drought threshold triggers risk', () => {
    const data = [
      pt(40, DROUGHT_THRESHOLD_GWET - 0.01),
      pt(40, DROUGHT_THRESHOLD_GWET - 0.01),
      pt(40, DROUGHT_THRESHOLD_GWET - 0.01),
    ];
    expect(checkReversalRisk(data)).toBe(true);
  });
});

// ─── Indian agriculture context ───────────────────────────────────────────────

describe('Indian agriculture real-world scenarios', () => {
  it('Punjab wheat farmer: 250kg Urea application', () => {
    const r = calculateFertilizerEmissions('Urea', 250);
    // Expected: massN = 115, n2o_n = 1.15, n2o = 1.807, co2e ≈ 493.4
    expect(r.massN_kg).toBeCloseTo(115, 2);
    expect(r.co2e_kg).toBeCloseTo(115 * 0.01 * (44 / 28) * 273, 2);
  });

  it('Telangana rice farmer: 600kg rice residue burning', () => {
    const r = calculateResidueEmissions(600, 'rice');
    expect(r.co2e_kg).toBeCloseTo(600 * 1.47, 3);
    expect(r.emissionFactor).toBe(RESIDUE_EMISSION_FACTORS['rice']);
  });

  it('Rajasthan drought: 7 days 45°C, GWET 0.05 → definite reversal risk', () => {
    const data = Array(7).fill(null).map((_, i) =>
      pt(45, 0.05, `2026060${i + 1}`)
    );
    expect(checkReversalRisk(data)).toBe(true);
    expect(maxConsecutiveStressDays(data)).toBe(7);
  });

  it('Maharashtra monsoon: GWET > 0.8 → no risk even at high temp', () => {
    const data = [pt(39, 0.85), pt(40, 0.9), pt(42, 0.88)];
    expect(checkReversalRisk(data)).toBe(false);
  });

  it('DAP application common in India (50kg)', () => {
    const r = calculateFertilizerEmissions('DAP', 50);
    expect(r.massN_kg).toBeCloseTo(9, 3); // 50 × 0.18
    expect(r.co2e_kg).toBeGreaterThan(0);
    expect(r.co2e_kg).toBeLessThan(r.co2e_kg * 2); // sanity
  });
});

// ─── Precision tests ─────────────────────────────────────────────────────────

describe('numerical precision', () => {
  it('N2O-N calculation is precise to 6 decimal places', () => {
    const r = calculateFertilizerEmissions('Urea', 1);
    // massN = 0.46, n2o_n = 0.0046, n2o = 0.007229
    expect(r.n2o_n_direct_kg).toBeCloseTo(0.0046, 6);
    expect(r.n2o_direct_kg).toBeCloseTo(0.0046 * (44 / 28), 6);
  });

  it('CO2e calculation is precise to 4 decimal places', () => {
    const r = calculateFertilizerEmissions('NPK', 10);
    const expected = 10 * 0.15 * 0.01 * (44 / 28) * 273;
    expect(r.co2e_kg).toBeCloseTo(expected, 4);
  });

  it('large values (10,000 kg) stay numerically stable', () => {
    const r = calculateFertilizerEmissions('Urea', 10000);
    expect(Number.isFinite(r.co2e_kg)).toBe(true);
    expect(Number.isNaN(r.co2e_kg)).toBe(false);
    expect(r.co2e_kg).toBeGreaterThan(0);
  });
});

// ─── All fertilizer types coverage ───────────────────────────────────────────

describe('all supported fertilizer types produce valid results', () => {
  const types = Object.keys(NITROGEN_FRACTIONS);

  types.forEach((type) => {
    it(`${type} at 100kg produces positive, finite CO2e`, () => {
      const r = calculateFertilizerEmissions(type, 100);
      expect(r.co2e_kg).toBeGreaterThan(0);
      expect(Number.isFinite(r.co2e_kg)).toBe(true);
    });
  });
});

// ─── All crop types coverage ─────────────────────────────────────────────────

describe('all supported crop residue types produce valid results', () => {
  const crops = Object.keys(RESIDUE_EMISSION_FACTORS);

  crops.forEach((crop) => {
    it(`${crop} at 100kg produces positive CO2e`, () => {
      const r = calculateResidueEmissions(100, crop);
      expect(r.co2e_kg).toBeGreaterThan(0);
      expect(Number.isFinite(r.co2e_kg)).toBe(true);
    });
  });
});
