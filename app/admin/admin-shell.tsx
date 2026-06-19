// ═══════════════════════════════════════════════════════════
// Admin Shell — Client component with admin navigation
// ═══════════════════════════════════════════════════════════

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider } from '@/lib/supabase/auth-context';
import { Sidebar, BottomNav } from '@/components/ui';
import { createBrowserSupabase } from '@/lib/supabase/clients';

const ADMIN_NAV = [
  { label: 'Dashboard',      href: '/admin/dashboard',      icon: '📋' },
  { label: 'Setup 8vos',     href: '/admin/setup-r16',      icon: '🎯' },
  { label: 'Resultados',     href: '/admin/results',        icon: '⚽' },
  { label: 'Bracket',        href: '/admin/bracket',        icon: '🏆' },
  { label: 'Ranking',        href: '/admin/ranking',        icon: '📊' },
  { label: 'Participantes',  href: '/admin/participants',   icon: '👥' },
  { label: 'Aprobaciones',   href: '/admin/approvals',      icon: '✅' },
  { label: 'Config',         href: '/admin/config',         icon: '⚙️' },
];

export function AdminShell({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const items = ADMIN_NAV.map(item => ({
    ...item,
    active: pathname?.startsWith(item.href) ?? false,
  }));

  return (
    <AuthProvider initialRole="ADMIN" initialDisplayName={displayName}>
      <div className="flex min-h-screen">
        <Sidebar
          items={items}
          userName={displayName}
          role="Administrador"
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
        <BottomNav items={items} />
      </div>
    </AuthProvider>
  );
}