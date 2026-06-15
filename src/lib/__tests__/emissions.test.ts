/**
 * Unit tests for IPCC Tier 1 emission calculation functions.
 * All values independently verified against IPCC 2006 GL Vol 4 formulae.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateFertilizerEmissions,
  calculateResidueEmissions,
  NITROGEN_FRACTIONS,
  EF1,
  GWP_N2O,
  N2O_N_RATIO,
  RESIDUE_EMISSION_FACTORS,
} from '../emissions';

// ─── Constants ──────────────────────────────────────────────────────────────

describe('IPCC constants', () => {
  it('EF1 matches IPCC 2006 GL Vol 4 Tier 1 default (0.01)', () => {
    expect(EF1).toBe(0.01);
  });

  it('GWP_N2O matches IPCC AR6 100-year value (273)', () => {
    expect(GWP_N2O).toBe(273);
  });

  it('N2O_N_RATIO equals 44/28', () => {
    expect(N2O_N_RATIO).toBeCloseTo(44 / 28, 10);
  });

  it('Urea nitrogen fraction is 46%', () => {
    expect(NITROGEN_FRACTIONS['Urea']).toBe(0.46);
  });
});

// ─── Fertilizer Emissions ────────────────────────────────────────────────────

describe('calculateFertilizerEmissions', () => {
  it('calculates Urea 100 kg correctly', () => {
    const result = calculateFertilizerEmissions('Urea', 100);
    // massN = 100 × 0.46 = 46 kg
    expect(result.massN_kg).toBeCloseTo(46, 5);
    // n2o_n_direct = 46 × 0.01 = 0.46 kg N2O-N
    expect(result.n2o_n_direct_kg).toBeCloseTo(0.46, 5);
    // n2o_direct = 0.46 × (44/28) = 0.7229 kg N2O
    expect(result.n2o_direct_kg).toBeCloseTo(0.46 * (44 / 28), 5);
    // co2e = n2o × 273
    expect(result.co2e_kg).toBeCloseTo(0.46 * (44 / 28) * 273, 3);
  });

  it('calculates DAP 50 kg correctly', () => {
    const result = calculateFertilizerEmissions('DAP', 50);
    expect(result.massN_kg).toBeCloseTo(9, 5); // 50 × 0.18
    expect(result.co2e_kg).toBeGreaterThan(0);
  });

  it('scales linearly — doubling mass doubles CO2e', () => {
    const r1 = calculateFertilizerEmissions('Urea', 100);
    const r2 = calculateFertilizerEmissions('Urea', 200);
    expect(r2.co2e_kg).toBeCloseTo(r1.co2e_kg * 2, 5);
  });

  it('falls back to NPK fraction for unknown fertilizer type', () => {
    const result = calculateFertilizerEmissions('Unknown', 100);
    expect(result.massN_kg).toBeCloseTo(15, 5); // 100 × 0.15 (NPK default)
  });

  it('throws for zero mass', () => {
    expect(() => calculateFertilizerEmissions('Urea', 0)).toThrow('massKg must be greater than 0');
  });

  it('throws for negative mass', () => {
    expect(() => calculateFertilizerEmissions('Urea', -10)).toThrow('massKg must be greater than 0');
  });

  it('formulaTrace contains all key values', () => {
    const result = calculateFertilizerEmissions('Urea', 100);
    expect(result.formulaTrace).toContain('Urea');
    expect(result.formulaTrace).toContain('EF₁');
    expect(result.formulaTrace).toContain('GWP');
    expect(result.formulaTrace).toContain('CO₂e');
  });
});

// ─── Residue Emissions ───────────────────────────────────────────────────────

describe('calculateResidueEmissions', () => {
  it('calculates wheat residue burning correctly', () => {
    const result = calculateResidueEmissions(1000, 'wheat');
    expect(result.emissionFactor).toBe(RESIDUE_EMISSION_FACTORS['wheat']);
    expect(result.co2e_kg).toBeCloseTo(1000 * 1.52, 4);
  });

  it('calculates rice residue burning correctly', () => {
    const result = calculateResidueEmissions(500, 'rice');
    expect(result.co2e_kg).toBeCloseTo(500 * 1.47, 4);
  });

  it('falls back to "other" EF for unrecognised crop', () => {
    const result = calculateResidueEmissions(100, 'mango');
    expect(result.emissionFactor).toBe(RESIDUE_EMISSION_FACTORS['other']);
  });

  it('is case-insensitive for crop type', () => {
    const r1 = calculateResidueEmissions(100, 'Wheat');
    const r2 = calculateResidueEmissions(100, 'wheat');
    expect(r1.co2e_kg).toBe(r2.co2e_kg);
  });

  it('throws for zero residue mass', () => {
    expect(() => calculateResidueEmissions(0, 'wheat')).toThrow('residueMassKg must be greater than 0');
  });

  it('defaults cropType to "other" when not provided', () => {
    const result = calculateResidueEmissions(100);
    expect(result.emissionFactor).toBe(RESIDUE_EMISSION_FACTORS['other']);
  });
});
