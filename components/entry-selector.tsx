'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Entry {
  id: string;
  entryNumber: number;
  displayName: string;
  status: string;
  completionPct: number;
}

// Context to share active entryId
const EntryContext = createContext<{
  activeEntryId: string | null;
  setActiveEntryId: (id: string) => void;
}>({ activeEntryId: null, setActiveEntryId: () => {} });

export function useActiveEntry() {
  return useContext(EntryContext);
}

export function EntryProvider({ children }: { children: React.ReactNode }) {
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  return (
    <EntryContext.Provider value={{ activeEntryId, setActiveEntryId }}>
      {children}
    </EntryContext.Provider>
  );
}

export function EntrySelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeEntryId, setActiveEntryId } = useActiveEntry();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Read entry from URL on mount
	useEffect(() => {
    const urlEntry = searchParams?.get('entry');
    if (urlEntry) {
      setActiveEntryId(urlEntry);
      localStorage.setItem('activeEntryId', urlEntry);
    } else {
      // No entry in URL — check localStorage
      const stored = localStorage.getItem('activeEntryId');
      if (stored && entries.some(e => e.id === stored)) {
        setActiveEntryId(stored);
      }
    }
  }, [searchParams, entries]);

  const loadEntries = async () => {
    try {
      const res = await fetch('/api/entries/list');
      const data = await res.json();
      const list = data.entries ?? [];
      setEntries(list);

      // Auto-select first entry if none active
      const urlEntry = searchParams?.get('entry');
      if (!urlEntry && !activeEntryId && list.length > 0) {
        setActiveEntryId(list[0].id);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, [pathname, searchParams]);

  const handleSwitch = (entryId: string) => {
	localStorage.setItem('activeEntryId', entryId);
    setActiveEntryId(entryId);
    const params = new URLSearchParams(searchParams?.toString());
    params.set('entry', entryId);
    // Full page reload to force server component re-render
    window.location.href = `${pathname}?${params.toString()}`;
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/entries/create', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActiveEntryId(data.entryId);
        await loadEntries();
        // Navigate to new entry
        const params = new URLSearchParams(searchParams?.toString());
        params.set('entry', data.entryId);
		localStorage.setItem('activeEntryId', data.entryId);
        router.push(`${pathname}?${params.toString()}`);
		router.refresh();
      }
    } catch (err) {
      console.error('Error creating entry:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return null;
  if (entries.length === 0) return null;

  // Determine which entry is active (from URL or context)
  const currentEntryId = searchParams?.get('entry') ?? activeEntryId ?? entries[0]?.id;
  const allComplete = entries.length === 0 || entries.every(e => e.completionPct >= 100);
  console.log('entries completion:', entries.map(e => `${e.displayName}: ${e.completionPct}%`), 'allComplete:', allComplete);
  

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
      {entries.map(entry => (
        <button
          key={entry.id}
          onClick={() => handleSwitch(entry.id)}
          className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all
            ${entry.id === currentEntryId
              ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
              : 'bg-pp-bg-surface text-pp-text-secondary border border-pp-border hover:border-pp-border-light'}`}
        >
          {entry.displayName ?? `Quiniela ${entry.entryNumber}`}
          <span className="ml-1.5 text-[9px] opacity-60">{entry.completionPct}%</span>
        </button>
      ))}

      {allComplete && (
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-pp-bg-surface border border-pp-border 
            text-pp-gold hover:border-pp-gold/30 hover:bg-pp-gold/10
            text-xs font-bold transition-all"
        >
          {creating ? '...' : '+ Nueva quiniela'}
        </button>
      )}
    </div>
  );
}
