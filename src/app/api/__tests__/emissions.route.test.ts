/**
 * Integration tests for /api/compute-emissions
 * Firestore is mocked — tests cover HTTP layer + IPCC calculation only.
 *
 * Field contract (route.ts):
 *  - fertilizerType: 'Urea' | 'DAP' | 'NPK'  (capitalized)
 *  - massKg: number > 0
 *  - residueType: 'Burning' | 'Mulching'       (capitalized)
 *  - residueMassKg: number > 0
 *  Response: { n2o_kg, co2e_kg, formula_trace, success }
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// ── Mock Firebase before any imports ────────────────────────────────────────
vi.mock('@/config/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn().mockResolvedValue({ id: 'test-doc-id' }),
  serverTimestamp: vi.fn(() => new Date().toISOString()),
}));
// ─────────────────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/compute-emissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/compute-emissions', () => {
  it('exports a POST handler', async () => {
    const { POST } = await import('@/app/api/compute-emissions/route');
    expect(typeof POST).toBe('function');
  });

  it('returns 400 when body has no valid emission inputs', async () => {
    const { POST } = await import('@/app/api/compute-emissions/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('returns 400 for negative fertilizer mass', async () => {
    const { POST } = await import('@/app/api/compute-emissions/route');
    const res = await POST(makeRequest({ fertilizerType: 'Urea', massKg: -10 }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 for unknown fertilizer type', async () => {
    const { POST } = await import('@/app/api/compute-emissions/route');
    const res = await POST(makeRequest({ fertilizerType: 'unknown_xyz', massKg: 50 }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 with correct emission shape for valid Urea input', async () => {
    const { POST } = await import('@/app/api/compute-emissions/route');
    const res = await POST(makeRequest({ fertilizerType: 'Urea', massKg: 100 }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('n2o_kg');
    expect(json).toHaveProperty('co2e_kg');
    expect(json.success).toBe(true);
    expect(typeof json.co2e_kg).toBe('number');
    expect(json.co2e_kg).toBeGreaterThan(0);
  });

  it('returns correct CO₂e for 100kg Urea — IPCC Tier 1 formula', async () => {
    const { POST } = await import('@/app/api/compute-emissions/route');
    const res = await POST(makeRequest({ fertilizerType: 'Urea', massKg: 100 }) as any);
    const json = await res.json();
    // 100kg Urea × 46%N = 46kg N
    // N₂O-N = 46 × EF1(0.01) = 0.46 kg
    // N₂O   = 0.46 × (44/28) = 0.7229 kg
    // CO₂e  = 0.7229 × GWP(273) = 197.3 kg CO₂e
    expect(json.co2e_kg).toBeCloseTo(197.3, 0);
  });

  it('Burning residue produces higher CO₂e than Mulching', async () => {
    const { POST } = await import('@/app/api/compute-emissions/route');
    const [burnRes, mulchRes] = await Promise.all([
      POST(makeRequest({
        fertilizerType: 'Urea', massKg: 100,
        residueType: 'Burning', residueMassKg: 500, cropType: 'wheat',
      }) as any),
      POST(makeRequest({
        fertilizerType: 'Urea', massKg: 100,
        residueType: 'Mulching',
      }) as any),
    ]);
    const [burn, mulch] = await Promise.all([burnRes.json(), mulchRes.json()]);
    expect(burn.co2e_kg).toBeGreaterThan(mulch.co2e_kg);
  });
});
