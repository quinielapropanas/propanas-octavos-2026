// ═══════════════════════════════════════════════════════════
// useRankingsLive — Live leaderboard via Supabase Realtime
//
// Subscribes to INSERT/UPDATE on `rankings` table for the pool.
// RLS policies respect the subscription (users only receive
// broadcasts for rows they can SELECT).
// ═══════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/clients';
import type { LeaderboardEntry } from '@/lib/data/types';

interface LiveUpdate {
  userId: string;
  totalPoints: number;
  position: number | null;
  matchesPredicted: number;
  phase1Points: number;
  phase2Points: number;
}

export function useRankingsLive(
  poolId: string,
  initialEntries: LeaderboardEntry[],
): {
  entries: LeaderboardEntry[];
  lastUpdateAt: Date | null;
  connected: boolean;
} {
  const [entries, setEntries] = useState(initialEntries);
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();

    const channel = supabase
      .channel(`rankings:${poolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rankings',
          filter: `poolId=eq.${poolId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row?.userId) return;

          setLastUpdateAt(new Date());
          setEntries(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(e => e.userId === row.userId);

            const entry: LeaderboardEntry = {
              userId: row.userId,
              displayName: idx >= 0 ? updated[idx].displayName : 'Usuario',
              totalPoints: row.totalPoints,
              phase1Points: row.phase1Points,
              phase2Points: row.phase2Points,
              position: row.position ?? 0,
              matchesPredicted: row.matchesPredicted ?? 0,
              isCurrentUser: idx >= 0 ? updated[idx].isCurrentUser : false,
            };

            if (idx >= 0) updated[idx] = entry;
            else updated.push(entry);

            // Re-sort by points (highest first), then by predicted count
            updated.sort((a, b) =>
              b.totalPoints - a.totalPoints ||
              b.matchesPredicted - a.matchesPredicted
            );
            return updated;
          });
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId]);

  return { entries, lastUpdateAt, connected };
}
