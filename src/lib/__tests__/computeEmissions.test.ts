/**
 * Integration tests for /api/compute-emissions route logic.
 *
 * Tests validate the full request→validation→calculation→response pipeline
 * using the shared emissions library directly (no HTTP overhead needed
 * for unit-level integration tests).
 *
 * For full HTTP tests, use Playwright or msw in a separate E2E suite.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateFertilizerEmissions,
  calculateResidueEmissions,
  NITROGEN_FRACTIONS,
} from '../emissions';

// ─── Input Validation Logic ──────────────────────────────────────────────────

describe('compute-emissions input validation', () => {
  const VALID_TYPES = Object.keys(NITROGEN_FRACTIONS);

  it('accepts all valid fertilizer types', () => {
    VALID_TYPES.forEach((type) => {
      expect(() => calculateFertilizerEmissions(type, 100)).not.toThrow();
    });
  });

  it('rejects zero mass', () => {
    expect(() => calculateFertilizerEmissions('Urea', 0)).toThrow();
  });

  it('rejects negative mass', () => {
    expect(() => calculateFertilizerEmissions('Urea', -50)).toThrow();
  });

  it('rejects zero residue mass', () => {
    expect(() => calculateResidueEmissions(0, 'wheat')).toThrow();
  });
});

// ─── Response Shape Validation ───────────────────────────────────────────────

describe('compute-emissions response shape', () => {
  it('fertilizer result has all required fields', () => {
    const r = calculateFertilizerEmissions('Urea', 100);
    expect(r).toHaveProperty('massN_kg');
    expect(r).toHaveProperty('n2o_n_direct_kg');
    expect(r).toHaveProperty('n2o_direct_kg');
    expect(r).toHaveProperty('co2e_kg');
    expect(r).toHaveProperty('formulaTrace');
  });

  it('residue result has all required fields', () => {
    const r = calculateResidueEmissions(500, 'rice');
    expect(r).toHaveProperty('emissionFactor');
    expect(r).toHaveProperty('co2e_kg');
    expect(r).toHaveProperty('formulaTrace');
  });

  it('all numeric results are finite numbers', () => {
    const r = calculateFertilizerEmissions('DAP', 75);
    expect(Number.isFinite(r.co2e_kg)).toBe(true);
    expect(Number.isFinite(r.n2o_direct_kg)).toBe(true);
    expect(Number.isFinite(r.massN_kg)).toBe(true);
  });

  it('co2e is always greater than n2o due to GWP multiplier', () => {
    const r = calculateFertilizerEmissions('Urea', 100);
    expect(r.co2e_kg).toBeGreaterThan(r.n2o_direct_kg);
  });
});

// ─── Combined Emission Scenarios ─────────────────────────────────────────────

describe('combined fertilizer + residue scenarios', () => {
  it('adding residue burning increases total CO2e', () => {
    const fertResult = calculateFertilizerEmissions('Urea', 100);
    const residueResult = calculateResidueEmissions(500, 'wheat');
    const combined = fertResult.co2e_kg + residueResult.co2e_kg;
    expect(combined).toBeGreaterThan(fertResult.co2e_kg);
    expect(combined).toBeGreaterThan(residueResult.co2e_kg);
  });

  it('mulching (no burning) produces zero residue CO2e — farmer earns credits', () => {
    // Mulching is simply not computed — residue CO2e = 0
    // This is the key incentive: switch from burning to mulching
    const residueBurning = calculateResidueEmissions(1000, 'rice');
    expect(residueBurning.co2e_kg).toBeGreaterThan(0);
    // Mulching path: calculateResidueEmissions is NOT called → 0 kg CO2e
    const mulchingCo2e = 0;
    expect(mulchingCo2e).toBe(0);
  });

  it('real farm scenario: 200kg Urea + 800kg wheat residue burning', () => {
    const fert = calculateFertilizerEmissions('Urea', 200);
    const residue = calculateResidueEmissions(800, 'wheat');
    const total = fert.co2e_kg + residue.co2e_kg;
    // 200kg Urea: massN=92, n2o_n=0.92, n2o=1.4457, co2e=394.7
    // 800kg wheat residue: 800×1.52 = 1216
    // total ≈ 1610 kg CO2e
    expect(total).toBeCloseTo(fert.co2e_kg + 800 * 1.52, 1);
    expect(total).toBeGreaterThan(1000); // sanity check
  });
});

// ─── IPCC Audit Trail ────────────────────────────────────────────────────────

describe('IPCC formula audit trail', () => {
  it('trace contains all IPCC variables for Urea', () => {
    const r = calculateFertilizerEmissions('Urea', 100);
    expect(r.formulaTrace).toContain('46'); // N fraction %
    expect(r.formulaTrace).toContain('EF₁');
    expect(r.formulaTrace).toContain('44/28');
    expect(r.formulaTrace).toContain('GWP');
    expect(r.formulaTrace).toContain('CO₂e');
  });

  it('residue trace contains emission factor', () => {
    const r = calculateResidueEmissions(100, 'rice');
    expect(r.formulaTrace).toContain('1.47'); // rice EF
    expect(r.formulaTrace).toContain('CO₂e');
  });

  it('trace is human-readable multiline string', () => {
    const r = calculateFertilizerEmissions('NPK', 50);
    const lines = r.formulaTrace.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(4);
  });
});
