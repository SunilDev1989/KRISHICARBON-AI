/**
 * GET /api/weather
 *
 * Server-side proxy for the OpenWeatherMap Current Weather API.
 * Keeps OPENWEATHERMAP_API_KEY server-side — never sent to the browser.
 *
 * Responses are cached by Next.js for WEATHER_CACHE_SECONDS (5 minutes)
 * to avoid hammering the free-tier quota on every page render.
 */
import { NextRequest, NextResponse } from 'next/server';

/** Cache duration in seconds — OWM free tier allows 60 calls/minute */
const WEATHER_CACHE_SECONDS = 300;

/**
 * Proxy a current weather request to OpenWeatherMap and return results.
 *
 * @param req - Incoming Next.js request; expects `lat` and `lon` search params
 * @returns JSON weather object from OWM, or an error object
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required.' }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Weather API key not configured.' }, { status: 500 });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: WEATHER_CACHE_SECONDS } });
    if (!res.ok) {
      return NextResponse.json({ error: 'OpenWeatherMap API error.' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Weather fetch failed.', detail: String(e) }, { status: 500 });
  }
}

