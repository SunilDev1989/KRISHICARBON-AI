# KrishiCarbon AI 🌾🤖

> **Carbon Intelligence for Every Farmer** — A production-grade, real-time carbon ledger, climate risk, and AI verification engine built for agricultural ecosystems.

---

## # Problem Statement Alignment

> "The most urgent carbon-related problem for farmers is the dual squeeze of agriculture heavily emitting greenhouse gases (like methane and nitrous oxide) and the severe costs incurred as climate change destroys harvests, depletes groundwater, and degrades soil. Transitioning to low-carbon practices requires capital, while international supply chains require strict carbon tracking, trapping small-scale farmers in a verification trap where calculating sequestered carbon or emissions reduction is too complex and expensive."

**KrishiCarbon AI** directly dismantles this verification trap by providing:
- 🔬 **Free, automatic IPCC Tier 1 emission calculations** — no agronomist needed
- 🤖 **Gemini 1.5 Flash multimodal AI** — reads lab reports and voice inputs instantly
- 🛰️ **NASA POWER live telemetry** — real-time climate risk alerts at field level
- 🌐 **Multilingual (EN/HI/GU)** — accessible to every farmer regardless of literacy level
- 📡 **Firebase offline-first** — fully functional in low-connectivity rural regions

---

## Architecture

```
Next.js 14 (App Router)
├── Client: React Context API (LanguageContext, FarmContext)
├── Styling: Tailwind CSS — Warm Light Theme
├── Database: Firebase Cloud Firestore (offline persistence)
├── Storage: Firebase Storage (soil lab reports)
├── AI: Google Gemini 1.5 Flash (@google/generative-ai)
├── Live APIs:
│   ├── NASA POWER Agroclimatology API
│   ├── Google Places API (Transition Hub)
│   ├── OpenWeatherMap API
│   └── HTML5 Geolocation API
└── Charts: Chart.js + react-chartjs-2
```

---

## Core Modules

### Module 1: IPCC Tier 1 N₂O Emission Ledger (`/dashboard/ledger`)
- **Formula**: `N₂O_Direct = MassN × EF1(0.01) × (44/28)`
- **CO₂e**: `N₂O_Direct × GWP(273)`  *(IPCC AR6 GWP value)*
- Supports: Urea (46% N), DAP (18% N), NPK (15% N)
- Crop residue burning emission with biomass density factors
- All entries logged to Firestore `emissionLogs` collection
- Full IPCC formula trace available per entry

### Module 2: AI Soil & Voice Verification (`/dashboard/verify`)
- **Path A**: Drag-and-drop soil lab report (JPG/PNG/PDF) → Gemini Vision extraction
  - Returns: `{ soc, nitrogen, ph, bulkDensity }` — strict JSON
- **Path B**: Browser MediaRecorder audio → Gemini intent extraction
  - Supports Hindi, Gujarati, English voice inputs
  - Returns: `{ action, type, quantity_kg, crop, raw_transcript }`
- Files stored to Firebase Storage, URLs persisted to `soilLedgers`

### Module 3: NASA POWER Climate Risk Monitor (`/dashboard`)
- Live 7-day agroclimatology data: `T2M_MAX`, `GWETTOP`, `PRECTOTCORR`
- **Critical Reversal Logic**: IF `T2M_MAX > 38°C AND GWETTOP < 0.25` for 3+ consecutive days → CRITICAL REVERSAL RISK banner
- Live Chart.js dual-axis chart (temperature + topsoil wetness)

### Module 4: Local Transition Hub (`/dashboard/hub`)
- Google Places API via server-side proxy (avoids CORS, protects API key)
- 4 search categories: Organic Fertilizers, Solar Pumps, Biochar/Compost, Organic Seeds
- Haversine distance calculation from farm coordinates
- Supplier cards with directions, phone, open/closed status

---

## Directory Structure

```
/src
├── /config
│   └── firebase.ts          # Firebase init with offline persistence
├── /context
│   ├── LanguageContext.tsx  # EN/HI/GU i18n with localStorage persistence
│   └── FarmContext.tsx      # Coords, NASA, soil metrics, reversal risk
├── /app
│   ├── layout.tsx           # Sticky header, Inter font, providers
│   ├── page.tsx             # Landing page with problem statement
│   ├── /dashboard
│   │   ├── page.tsx         # Main analytics grid
│   │   ├── /ledger/page.tsx # Emission history + CSV export
│   │   ├── /verify/page.tsx # Lab upload + voice recorder
│   │   └── /hub/page.tsx    # Google Places supplier discovery
│   └── /api
│       ├── /compute-emissions/route.ts
│       ├── /extract-soil/route.ts
│       ├── /voice-intent/route.ts
│       └── /places/route.ts
├── /components/ui           # 10+ accessible, warm-theme components
└── /lib/utils.ts            # clsx + tailwind-merge
/public
└── /locales
    ├── en.json              # ~80 English tokens
    ├── hi.json              # Hindi translations
    └── gu.json              # Gujarati translations
```

---

## Setup

### Prerequisites
- Node.js 18+
- Firebase project with Firestore (Native mode) + Storage enabled
- Google Cloud project with Places API + Geocoding API enabled

### 1. Clone & Install
```bash
git clone https://github.com/your-org/krishicarbon-ai
cd krishicarbon-ai
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...         # From Firebase Console
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=krishicarbon-ai-d08f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=krishicarbon-ai-d08f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=krishicarbon-ai-d08f5.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
GEMINI_API_KEY=...                       # From Google AI Studio
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...      # Google Maps Platform
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=...   # OpenWeatherMap
```

### 3. Firebase Setup
In Firebase Console:
1. Create Firestore database in **Native mode**
2. Enable Firebase Storage
3. Add Firestore security rules (start with test mode for dev)
4. Copy Web App SDK config to `.env.local`

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Multilingual Support

All UI text resolves via the `LanguageContext`:
```tsx
const { t } = useLanguage();
return <h1>{t('dashboard.title')}</h1>;
```

Locale files: `/public/locales/en.json`, `hi.json`, `gu.json`

---

## IPCC Emission Formula Reference

```
Mass N (kg)  = Fertilizer Mass × N fraction
              (Urea: 46%, DAP: 18%, NPK: 15%)

N₂O-N Direct = Mass N × EF₁ (0.01 kg N₂O-N per kg N)
N₂O (kg)     = N₂O-N Direct × (44/28)
CO₂e (kg)    = N₂O (kg) × GWP (273 — IPCC AR6)
```

**Example**: 100 kg Urea → Mass N = 46 kg → N₂O = 0.657 kg → **CO₂e = 179.5 kg**

---

## Verification Test

| Input | Expected N₂O | Expected CO₂e |
|-------|-------------|---------------|
| 100 kg Urea | 0.6571 kg | 179.4 kg |
| 100 kg DAP | 0.2571 kg | 70.2 kg |
| 500 kg wheat residue (burning) | — | 760 kg |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Database | Firebase Firestore (offline-first) |
| Storage | Firebase Storage |
| AI | Google Gemini 1.5 Flash |
| Live Data | NASA POWER API |
| Weather | OpenWeatherMap API |
| Maps | Google Places API |
| Charts | Chart.js + react-chartjs-2 |
| Icons | Lucide React |

---

## License

MIT License — Built for the farmers of India 🌾

---

*KrishiCarbon AI — Zero compromise on carbon intelligence.*
