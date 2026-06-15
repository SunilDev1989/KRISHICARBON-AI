import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { FarmProvider } from '@/context/FarmContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import Link from 'next/link';
import { Leaf, BarChart3, BookOpen, FlaskConical, Store, Lightbulb } from 'lucide-react';
import ClientNav from '@/components/ui/ClientNav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KrishiCarbon AI — Carbon Intelligence for Every Farmer',
  description:
    'Real-time carbon tracking, IPCC-grade emission ledger, AI soil verification, and climate risk monitoring for Indian farmers.',
  keywords: 'carbon farming, agriculture emissions, soil carbon, climate risk, IPCC, India farmers',
  openGraph: {
    title: 'KrishiCarbon AI',
    description: 'Carbon Intelligence for Every Farmer',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-[#fafdf7] via-[#f7faf3] to-[#fdf9f0] font-sans antialiased">
        <LanguageProvider>
          <FarmProvider>
            {/* Skip to main content — keyboard / screen reader accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-700 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg"
            >
              Skip to main content
            </a>

            {/* Global Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-sm" role="banner">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  {/* Logo */}
                  <Link href="/" className="flex items-center gap-2.5 group" aria-label="KrishiCarbon AI — home">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <span className="font-bold text-emerald-800 text-lg leading-tight block">KrishiCarbon AI</span>
                      <span className="text-xs text-emerald-500 leading-none">Carbon Intelligence</span>
                    </div>
                  </Link>

                  <ClientNav />

                  {/* Language Switcher */}
                  <LanguageSwitcher />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main id="main-content" className="min-h-[calc(100vh-64px)]" role="main">
              {children}
            </main>

            {/* Footer */}
            <footer className="bg-emerald-900 text-emerald-100 py-8 mt-16">
              <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white text-lg">KrishiCarbon AI</span>
                </div>
                <p className="text-sm text-emerald-300 max-w-md mx-auto">
                  Empowering Indian farmers with real-time carbon intelligence, AI-verified soil data, and access to the local green economy.
                </p>
                <p className="text-xs text-emerald-600 pt-2">
                  © {new Date().getFullYear()} KrishiCarbon AI · Built for the farmers of India
                </p>
              </div>
            </footer>
          </FarmProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
