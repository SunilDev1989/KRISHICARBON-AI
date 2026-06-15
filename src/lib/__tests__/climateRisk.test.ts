/**
 * Unit tests for carbon reversal risk detection algorithm.
 * Validates the IPCC-aligned climate risk model used in the dashboard.
 */
import { describe, it, expect } from 'vitest';
import {
  checkReversalRisk,
  maxConsecutiveStressDays,
  HEAT_THRESHOLD_C,
  DROUGHT_THRESHOLD_GWET,
  CONSECUTIVE_DAYS_THRESHOLD,
} from '../climateRisk';
import type { NasaDataPoint } from '@/context/FarmContext';

// Helper to build a data point
function pt(t2m_max: number, gwettop: number, date = '20260601'): NasaDataPoint {
  return { date, t2m_max, gwettop, prectot: 0 };
}

// ─── Thresholds ──────────────────────────────────────────────────────────────

describe('climate risk thresholds', () => {
  it('heat threshold is 38°C', () => {
    expect(HEAT_THRESHOLD_C).toBe(38);
  });
  it('drought threshold is 0.25 (25% soil saturation)', () => {
    expect(DROUGHT_THRESHOLD_GWET).toBe(0.25);
  });
  it('consecutive days threshold is 3', () => {
    expect(CONSECUTIVE_DAYS_THRESHOLD).toBe(3);
  });
});

// ─── checkReversalRisk ───────────────────────────────────────────────────────

describe('checkReversalRisk', () => {
  it('returns false for empty data', () => {
    expect(checkReversalRisk([])).toBe(false);
  });

  it('returns false when fewer than 3 data points', () => {
    expect(checkReversalRisk([pt(40, 0.1), pt(40, 0.1)])).toBe(false);
  });

  it('returns true for exactly 3 consecutive stress days', () => {
    const data = [pt(39, 0.1), pt(40, 0.2), pt(41, 0.1)];
    expect(checkReversalRisk(data)).toBe(true);
  });

  it('returns false when stress is interrupted after 2 days', () => {
    const data = [pt(39, 0.1), pt(40, 0.2), pt(30, 0.5), pt(41, 0.1)];
    expect(checkReversalRisk(data)).toBe(false);
  });

  it('returns false when temperature is below threshold even with dry soil', () => {
    const data = [pt(37, 0.1), pt(37, 0.1), pt(37, 0.1)];
    expect(checkReversalRisk(data)).toBe(false);
  });

  it('returns false when soil is wet even with high temperature', () => {
    const data = [pt(40, 0.5), pt(40, 0.6), pt(40, 0.7)];
    expect(checkReversalRisk(data)).toBe(false);
  });

  it('correctly resets counter after a good day', () => {
    const data = [
      pt(40, 0.1), pt(40, 0.1), // 2 stress days
      pt(30, 0.5),               // good day — resets counter
      pt(40, 0.1), pt(40, 0.1), pt(40, 0.1), // 3 more stress → risk!
    ];
    expect(checkReversalRisk(data)).toBe(true);
  });

  it('skips NASA sentinel values (-999) and resets counter', () => {
    const data = [
      pt(40, 0.1), pt(40, 0.1),
      pt(-999, -999), // missing data — should reset
      pt(40, 0.1), pt(40, 0.1),
    ];
    expect(checkReversalRisk(data)).toBe(false); // only 2 days each side
  });

  it('returns true for 7-day sustained stress window', () => {
    const data = Array(7).fill(null).map((_, i) => pt(42, 0.1, `2026060${i + 1}`));
    expect(checkReversalRisk(data)).toBe(true);
  });
});

// ─── maxConsecutiveStressDays ─────────────────────────────────────────────────

describe('maxConsecutiveStressDays', () => {
  it('returns 0 for no stress', () => {
    const data = [pt(30, 0.5), pt(28, 0.6)];
    expect(maxConsecutiveStressDays(data)).toBe(0);
  });

  it('returns correct max across multiple stress windows', () => {
    const data = [
      pt(40, 0.1), pt(40, 0.1),           // window 1: 2 days
      pt(30, 0.5),                          // break
      pt(40, 0.1), pt(40, 0.1), pt(40, 0.1), pt(40, 0.1), // window 2: 4 days
    ];
    expect(maxConsecutiveStressDays(data)).toBe(4);
  });
});
