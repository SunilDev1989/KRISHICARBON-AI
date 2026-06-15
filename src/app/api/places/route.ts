/**
 * GET /api/places
 *
 * Server-side proxy for the Google Places Text Search API.
 * Keeps the GOOGLE_MAPS_API_KEY server-side — never exposed to the browser.
 *
 * Returns suppliers within SEARCH_RADIUS_METERS of the supplied coordinates,
 * defaulting to the geographic centre of India when no location is provided.
 */
import { NextRequest, NextResponse } from 'next/server';

/** Search radius in metres — 30 km covers most rural market catchment areas */
const SEARCH_RADIUS_METERS = 30_000;

/** Geographic centre of India — used as default when no GPS coordinates are supplied */
const INDIA_CENTER_LAT = '20.5937';
const INDIA_CENTER_LON = '78.9629';

/**
 * Proxy a Google Places Text Search request and return results.
 *
 * @param req - Incoming Next.js request with `query`, `lat`, `lon` search params
 * @returns JSON response from Google Places API or an error object
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') ?? 'organic fertilizer';
  const lat = searchParams.get('lat') ?? INDIA_CENTER_LAT;
  const lon = searchParams.get('lon') ?? INDIA_CENTER_LON;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured.' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lon}&radius=${SEARCH_RADIUS_METERS}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Places API fetch failed.', detail: String(e) }, { status: 500 });
  }
}

