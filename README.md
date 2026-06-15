# 🌾 KrishiCarbon AI

[![Live Demo](https://img.shields.io/badge/Live%20Demo-krishicarbon--ai.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://krishicarbon-ai.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/Tests-65%20passing-success?style=for-the-badge&logo=vitest)](https://github.com/SunilDev1989/KRISHICARBON-AI)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **"The most urgent carbon-related problem for farmers is the dual squeeze of agriculture heavily emitting greenhouse gases and the severe costs incurred as climate change destroys harvests, depletes groundwater, and degrades soil. Transitioning to low-carbon practices requires capital, while international supply chains require strict carbon tracking, trapping small-scale farmers in a verification trap where calculating sequestration is too complex and expensive."**

KrishiCarbon AI is a production-grade, zero-mock-data carbon ledger, climate risk, and verification engine built for Indian smallholder farmers. It breaks the verification trap by making IPCC Tier 1 carbon accounting as simple as a voice note — free, offline-capable, and multilingual.

---

## 🏆 Hackathon Evaluation Alignment

| Criterion | Implementation |
|-----------|---------------|
| **Code Quality** | Shared pure libs (`lib/emissions.ts`, `lib/climateRisk.ts`), strict TypeScript, JSDoc with IPCC citations, DRY API routes, single `next.config.ts` |
| **Security** | Server-side API key proxying, CSP + HSTS + X-Frame-Options headers, rate limiting (30 req/min), file size validation, immutable Firestore audit rules |
| **Efficiency** | NASA POWER sessionStorage cache (1hr TTL), weather edge cache (5min), Gemini 4-model auto-fallback, Firebase offline-first IndexedDB |
| **Testing** | 65 unit + integration tests across 4 suites — `npm test` runs in <600ms |
| **Accessibility** | Skip-to-content, ARIA landmarks, fieldset/legend radio groups, aria-live alerts, EN/HI/GU i18n, focus:ring on all interactive elements |
| **Problem Statement** | Directly solves the verification trap: free IPCC math, offline persistence, voice input for low-literacy farmers, real NASA climate risk |

---

## 🚀 Quick Start

**🌐 Live Demo:** [https://krishicarbon-ai.vercel.app/](https://krishicarbon-ai.vercel.app/)

```bash
git clone https://github.com/SunilDev1989/KRISHICARBON-AI.git
cd KRISHICARBON-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys (see Configuration section below)

# Run tests
npm test

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Configuration

Create `.env.local` with the following keys:

```env
# Gemini AI — Google AI Studio (server-side only, never exposed to browser)
GEMINI_API_KEY=your_gemini_api_key

# Firebase — Firestore + Storage
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenWeatherMap — proxied server-side (key never reaches browser)
OPENWEATHERMAP_API_KEY=your_owm_key

# Google Maps Places — proxied server-side
GOOGLE_MAPS_API_KEY=your_maps_key
```

> **Security note**: Only `NEXT_PUBLIC_FIREBASE_*` keys are exposed to the browser (required by Firebase SDK). All other keys (`GEMINI_API_KEY`, `OPENWEATHERMAP_API_KEY`, `GOOGLE_MAPS_API_KEY`) are strictly server-side only, proxied through `/api/*` routes.

---

## 🧪 Testing

```bash
# Run all tests (65 tests across 4 suites)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test suites:**

| Suite | Tests | Coverage |
|-------|-------|----------|
| `emissions.test.ts` | 17 | IPCC formula correctness, linearity, error handling |
| `climateRisk.test.ts` | 14 | Reversal risk detection, threshold boundaries, sentinels |
| `computeEmissions.test.ts` | 14 | API validation, response shape, combined scenarios |
| `edgeCases.test.ts` | 20 | Boundaries, Indian farm scenarios, precision, all crop/fertilizer types |

All tests run in **< 600ms** with zero external dependencies (pure functions, no mocking needed).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                │
├───────────────────┬─────────────────────────────────────┤
│   Client (React)  │         Server (API Routes)         │
│                   │                                     │
│  FarmContext ──── │──▶ /api/compute-emissions           │
│  (sessionStorage  │      Uses lib/emissions.ts (IPCC)   │
│   NASA cache)     │                                     │
│                   │──▶ /api/extract-soil                │
│  Gemini Flash AI  │      Gemini 2.5-flash inlineData    │
│  soil extraction  │      + 4-model auto-fallback        │
│                   │                                     │
│  NASA POWER       │──▶ /api/weather (proxied OWM)       │
│  7-day telemetry  │──▶ /api/places  (proxied Maps)      │
│                   │──▶ /api/voice-intent (Gemini)       │
│  Firebase SDK     │                                     │
│  (offline-first   │    Security Middleware              │
│   IndexedDB)      │    Rate limit: 30 req/min/IP        │
└───────────────────┴─────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Firebase Cloud   │
                    │  Firestore + GCS   │
                    │ (immutable ledger) │
                    └───────────────────┘
```

---

## 🌍 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — problem statement, CTA |
| `/dashboard` | Live NASA POWER climate data, weather widget, carbon reversal risk alert |
| `/dashboard/ledger` | Emission calculator (IPCC Tier 1) + Firestore ledger |
| `/dashboard/hub` | Supplier marketplace, carbon credits, verification certificates |
| `/dashboard/verify` | Gemini AI soil lab report extraction (PDF + image) |

---

## 🔬 IPCC Tier 1 Emission Formula

The core carbon accounting uses peer-reviewed IPCC 2006 Guidelines, Vol. 4:

```
Mass N (kg)       = Applied Fertilizer (kg) × N_fraction
N₂O-N Direct (kg) = Mass N × EF₁ (0.01)          [IPCC Eq. 11.1]
N₂O Direct (kg)   = N₂O-N × (44/28)
CO₂e (kg)         = N₂O Direct × GWP_N₂O (273)   [IPCC AR6]
```

**Residue Burning:**
```
CO₂e (kg) = Residue Mass (kg) × EF_crop           [IPCC Vol.4 Table 2.5]
```

Every calculation produces a full `formulaTrace` audit string — an evaluator can verify the math line-by-line.

---

## 📡 NASA POWER Integration

Fetches 7 days of agroclimatology data per farm GPS coordinates:

- `T2M_MAX` — Maximum 2m air temperature (°C)
- `GWETTOP` — Topsoil wetness ratio (0–1)
- `PRECTOTCORR` — Corrected precipitation (mm/day)

**Carbon Reversal Risk Algorithm:**
If `T2M_MAX > 38°C` AND `GWETTOP < 0.25` for **3+ consecutive days**, a red alert fires — soil organic carbon is oxidising back to CO₂, voiding carbon credits.

Results are cached in `sessionStorage` with a 1-hour TTL (NASA data is daily, not real-time).

---

## ♿ Accessibility

- **WCAG 2.1 AA** compliant structural markup
- Skip-to-content link (visible on keyboard focus)
- All form inputs: `<label htmlFor>` + `id` + `aria-describedby`
- Custom radio buttons: `role="radio"` + `aria-checked`
- Error messages: `role="alert"` + `aria-live="assertive"`
- Results: `aria-live="polite"` — announced without interrupting
- Buttons: `aria-expanded`, `aria-busy`, `aria-label`
- Keyboard navigation: `focus:ring-2` on all interactive elements
- Multilingual: **English** · **हिन्दी** · **ગુજરાતી**

---

## 🔐 Security

- **API keys**: All sensitive keys are server-only env vars
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- **Rate limiting**: 30 requests/minute per IP (edge middleware)
- **File validation**: 10 MB max upload size (HTTP 413)
- **Input validation**: Type whitelist + numeric bounds on all API inputs
- **Firestore rules**: Immutable audit ledger — entries cannot be deleted or modified

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | SSR, Edge Middleware, API Routes |
| AI | Gemini 2.5 Flash | Soil PDF extraction, voice intent parsing |
| Database | Firebase Firestore | Offline-first IndexedDB persistence |
| Storage | Firebase Storage | Soil report file storage |
| Climate Data | NASA POWER API | Free, authoritative agroclimatology |
| Weather | OpenWeatherMap | Current field-level conditions |
| Charts | Chart.js | Carbon trend visualisation |
| Styling | Tailwind CSS v4 | Utility-first, consistent design |
| Testing | Vitest | Fast, zero-config unit tests |
| i18n | Custom LanguageContext | EN / HI / GU |

---

## 🌱 Problem Statement Solution

| Farmer Pain Point | KrishiCarbon AI Solution |
|-------------------|--------------------------|
| Carbon verification is too complex | IPCC Tier 1 = one form, one number, one audit trail |
| Labs & consultants are too expensive | Gemini AI reads soil lab PDFs for free |
| No internet in villages | Firebase offline-first — works without connectivity |
| English-only tools | EN / हिन्दी / ગુજરાતી + voice input |
| Can't prove carbon credits to buyers | Immutable Firestore ledger + verification certificates |
| Climate risk destroys sequestration | NASA POWER reversal risk alerts |

---

## 📄 License

MIT — Open source for the benefit of farmers everywhere.

---

*Built for the Google Cloud + Gemini Hackathon 2026 · KrishiCarbon AI*
