// ═══════════════════════════════════════════════════════════
// Participant Shell — Client component with nav + AuthProvider
// Receives serializable props from the server layout.
// ═══════════════════════════════════════════════════════════

'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider } from '@/lib/supabase/auth-context';
import { Sidebar, BottomNav } from '@/components/ui';
import { EntrySelector, EntryProvider } from '@/components/entry-selector';
import { createBrowserSupabase } from '@/lib/supabase/clients';

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',     icon: '🏠' },
  { label: 'Equipos',    href: '/equipos',        icon: '🌍' },
  { label: 'Grupos',     href: '/groups',         icon: '⚽' },
  { label: 'Bracket',    href: '/bracket',        icon: '🏆' },
  { label: 'Ranking',    href: '/leaderboard',    icon: '📊' },
];

function ShellContent({
  children, displayName, role, groupsComplete, thirdsConfirmed,
}: {
  children: React.ReactNode;
  displayName: string;
  role: 'ADMIN' | 'PARTICIPANT';
  groupsComplete: boolean;
  thirdsConfirmed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeEntryId, setActiveEntryId] = useState('');

  useEffect(() => {
    const urlEntry = searchParams?.get('entry');
    if (urlEntry) {
      setActiveEntryId(urlEntry);
      try { localStorage.setItem('activeEntryId', urlEntry); } catch {}
    } else {
      try {
        const stored = localStorage.getItem('activeEntryId');
        if (stored) setActiveEntryId(stored);
      } catch {}
    }
  }, [searchParams]);

  const handleLogout = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    try { localStorage.removeItem('activeEntryId'); } catch {}
    router.push('/login');
  };

  const items = NAV_ITEMS.map(item => {
    const active = pathname?.startsWith(item.href) ?? false;
    let disabled = false;

    if (item.href === '/best-thirds' && !groupsComplete) disabled = true;
    if (item.href === '/bracket' && !thirdsConfirmed) disabled = true;

    const href = activeEntryId ? `${item.href}?entry=${activeEntryId}` : item.href;

    return { ...item, href, active, disabled };
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={items}
        userName={displayName}
        role={role === 'ADMIN' ? 'Admin' : 'Participante'}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-5xl mx-auto w-full">
        <EntrySelector />
        {children}
      </main>
      <BottomNav items={items} />
    </div>
  );
}

export function ParticipantShell({
  children, displayName, role, userId,
  groupsComplete = false, thirdsConfirmed = false,
}: {
  children: React.ReactNode;
  displayName: string;
  role: 'ADMIN' | 'PARTICIPANT';
  userId: string;
  groupsComplete?: boolean;
  thirdsConfirmed?: boolean;
}) {
  return (
    <AuthProvider initialRole={role} initialDisplayName={displayName}>
      <EntryProvider>
        <ShellContent
          displayName={displayName}
          role={role}
          groupsComplete={groupsComplete}
          thirdsConfirmed={thirdsConfirmed}
        >
          {children}
        </ShellContent>
      </EntryProvider>
    </AuthProvider>
  );
}