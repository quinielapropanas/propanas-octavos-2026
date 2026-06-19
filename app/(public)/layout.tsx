'use client';

import { BottomNav } from '@/components/ui';

const PUBLIC_NAV = [
  { label: 'Fixture', href: '/fixtures', icon: '📅', active: false },
  { label: 'Bracket', href: '/bracket', icon: '🏆', active: false },
  { label: 'Ranking', href: '/leaderboard', icon: '📊', active: false },
  { label: 'Equipos', href: '/teams', icon: '⚽', active: false },
  { label: 'Entrar', href: '/login', icon: '🔑', active: false },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="bg-pp-navy border-b border-pp-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div>
          <span className="text-pp-gold font-black text-sm tracking-wider">PROPANAS</span>
          <span className="text-[9px] text-pp-text-muted tracking-[3px] ml-2">2026</span>
        </div>
        <a href="/login" className="text-xs text-pp-gold font-semibold hover:underline">Iniciar sesión</a>
      </header>

      <main className="p-4 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
        {children}
      </main>

      <BottomNav items={PUBLIC_NAV} />
    </div>
  );
}

