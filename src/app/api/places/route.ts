import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') ?? 'organic fertilizer';
  const lat = searchParams.get('lat') ?? '20.5937';
  const lon = searchParams.get('lon') ?? '78.9629';
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured.' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lon}&radius=30000&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Places API fetch failed.', detail: String(e) }, { status: 500 });
  }
}
