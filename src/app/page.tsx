'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { BarChart3, Leaf, Satellite, Store, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: BarChart3,
      titleKey: 'feature.emissions.title',
      descKey: 'feature.emissions.desc',
      color: 'emerald',
      emoji: '📊',
    },
    {
      icon: Zap,
      titleKey: 'feature.ai.title',
      descKey: 'feature.ai.desc',
      color: 'blue',
      emoji: '🤖',
    },
    {
      icon: Store,
      titleKey: 'feature.hub.title',
      descKey: 'feature.hub.desc',
      color: 'amber',
      emoji: '🏪',
    },
  ];

  const stats = [
    { value: '273×', label: 'GWP of N₂O vs CO₂', icon: '🌡️' },
    { value: 'IPCC', label: 'Tier 1 Certified Formula', icon: '✅' },
    { value: '3', label: 'Languages Supported', icon: '🗣️' },
    { value: 'NASA', label: 'Live Agro Data Source', icon: '🛰️' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200">
                <Leaf className="w-4 h-4" />
                Carbon Intelligence Platform for Agriculture
              </div>

              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                {t('hero.title')}
                <span className="block text-emerald-600">AI</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98] text-lg"
                >
                  {t('hero.cta')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/dashboard/verify"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-all border-2 border-emerald-200 hover:border-emerald-400 text-lg"
                >
                  AI Soil Verify
                  <ShieldCheck className="w-5 h-5" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {['IPCC Tier 1', 'NASA POWER', 'Gemini AI', 'Firebase Offline'].map((badge) => (
                  <span key={badge} className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative w-full h-80 lg:h-[460px] rounded-3xl overflow-hidden shadow-2xl shadow-emerald-200/50">
                <Image
                  src="/images/farm_hero_banner.png"
                  alt="Indian farmers in green agricultural fields with carbon monitoring technology"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Overlay Cards */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  <div className="bg-white/95 backdrop-blur rounded-xl p-3 flex-1 shadow-lg">
                    <p className="text-xs text-gray-400">Last N₂O Entry</p>
                    <p className="text-lg font-bold text-emerald-700">12.5 kg CO₂e</p>
                  </div>
                  <div className="bg-white/95 backdrop-blur rounded-xl p-3 flex-1 shadow-lg">
                    <p className="text-xs text-gray-400">Soil Carbon</p>
                    <p className="text-lg font-bold text-blue-700">2.3% SOC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="bg-gradient-to-br from-amber-900 via-stone-800 to-emerald-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/carbon_cycle_illustration.png" alt="" fill className="object-cover" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl font-black text-amber-100 mb-6">
            # Problem Statement Alignment
          </h2>
          <blockquote className="text-lg text-amber-200 leading-relaxed italic border-l-4 border-amber-400 pl-6 text-left">
            &ldquo;The most urgent carbon-related problem for farmers is the dual squeeze of agriculture heavily emitting greenhouse gases (like methane and nitrous oxide) and the severe costs incurred as climate change destroys harvests, depletes groundwater, and degrades soil. Transitioning to low-carbon practices requires capital, while international supply chains require strict carbon tracking, trapping small-scale farmers in a verification trap where calculating sequestered carbon or emissions reduction is too complex and expensive.&rdquo;
          </blockquote>
          <p className="mt-6 text-amber-400 text-sm font-semibold">KrishiCarbon AI directly solves this verification trap.</p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon }) => (
            <div key={label} className="text-center">
              <div className="text-3xl mb-1">{icon}</div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900">Platform Modules</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Four integrated modules working together to give every farmer a complete carbon intelligence system.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, titleKey, descKey, color, emoji }) => (
            <div
              key={titleKey}
              className={`relative p-7 rounded-3xl border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default ${
                color === 'emerald' ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 hover:border-emerald-400' :
                color === 'blue' ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 hover:border-blue-400' :
                'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 hover:border-amber-400'
              }`}
            >
              <div className="text-4xl mb-4">{emoji}</div>
              <Icon className={`w-6 h-6 mb-3 ${
                color === 'emerald' ? 'text-emerald-600' :
                color === 'blue' ? 'text-blue-600' : 'text-amber-600'
              }`} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t(titleKey)}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>

        {/* NASA Module Card */}
        <div className="mt-6 p-7 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-4xl mb-3">🛰️</div>
              <Satellite className="w-6 h-6 text-blue-700 mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">NASA POWER Live Telemetry</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Real-time agroclimatology data from NASA&apos;s POWER API — maximum temperature, topsoil wetness, and precipitation — with automatic Carbon Reversal Risk detection.
              </p>
            </div>
            <div className="relative h-48 rounded-2xl overflow-hidden">
              <Image src="/images/soil_carbon_illustration.png" alt="Soil carbon cross-section" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-700 py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Globe className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-4">Ready to track your farm&apos;s carbon?</h2>
          <p className="text-emerald-200 mb-8">Start logging emissions, verifying soil data, and accessing the local green economy — all in one platform.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-xl text-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Open Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
