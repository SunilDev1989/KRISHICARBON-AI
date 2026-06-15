'use client';

import Link from 'next/link';
import { BarChart3, BookOpen, FlaskConical, Lightbulb, Store } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ClientNav() {
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard',          icon: BarChart3,    labelKey: 'nav.dashboard' },
    { href: '/dashboard/ledger',   icon: BookOpen,     labelKey: 'nav.ledger' },
    { href: '/dashboard/verify',   icon: FlaskConical, labelKey: 'nav.verify' },
    { href: '/dashboard/insights', icon: Lightbulb,    labelKey: 'nav.insights' },
    { href: '/dashboard/hub',      icon: Store,        labelKey: 'nav.hub' },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
      {navItems.map(({ href, icon: Icon, labelKey }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-150"
        >
          <Icon className="w-4 h-4" />
          {t(labelKey)}
        </Link>
      ))}
    </nav>
  );
}
