'use client';

import { useState } from 'react';
import { PageHeader, Card, Badge, RankRow } from '@/components/ui';
import type { LeaderboardData } from '@/lib/data/types';

interface ConceptBreakdown {
  conceptId: number;
  name: string;
  pointsPerHit: number;
  evaluations: number;
  hits: number;
  totalPoints: number;
  details: Array<{
    pointsAwarded: number;
    explanation: string;
    matchId: string | null;
    slotId: string | null;
  }>;
}

interface BreakdownData {
  entry: { id: string; displayName: string };
  position: number | null;
  totalPoints: number;
  phase1Points: number;
  phase2Points: number;
  concepts: ConceptBreakdown[];
}

export function AdminRankingClient({ initialData }: { initialData: LeaderboardData }) {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async (userId: string) => {
    if (selectedEntry === userId) {
      setSelectedEntry(null);
      setBreakdown(null);
      return;
    }

    setSelectedEntry(userId);
    setLoading(true);
    try {
      const entry = initialData.entries.find(e => e.userId === userId);
      const breakdownId = entry?.entryId ?? userId;
      const res = await fetch(`/api/breakdown?entryId=${breakdownId}`);
      const data = await res.json();
      if (!data.error) {
        setBreakdown(data);
      } else {
        setBreakdown(null);
      }
    } catch {
      setBreakdown(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ranking" subtitle={`${initialData.total} participantes`} />

      {initialData.entries.length === 0 ? (
        <Card className="text-center py-8">
          <div className="text-pp-text-muted text-sm">
            No hay puntajes aún. Carga resultados oficiales y ejecuta el recálculo.
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
		{initialData.entries.map(r => {
            const isPaid = (r as any).entryStatus === 'APPROVED';
            const isSubmitted = (r as any).entryStatus === 'SUBMITTED';

            return (
              <div key={r.userId}>
				<div onClick={() => handleClick(r.userId)} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0
                      ${isPaid
                        ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                        : isSubmitted
                          ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                          : 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]'}`}
                    />
                    <div className="flex-1">
                      <RankRow
                        position={r.position}
                        name={r.displayName}
                        points={r.totalPoints}
                        isCurrentUser={false}
                      />
                    </div>
                  </div>
                </div>

                {selectedEntry === r.userId && (
                  <div className="mt-1 ml-4 mr-1 mb-3">
                    {loading ? (
                      <Card>
                        <div className="text-center py-4 text-pp-text-muted text-sm">Cargando desglose...</div>
                      </Card>
                    ) : breakdown ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="bg-pp-bg-surface rounded-lg p-2 text-center">
                            <div className="text-[9px] text-pp-text-muted">Grupos</div>
                            <div className="text-sm font-black text-pp-text">{breakdown.phase1Points}</div>
                          </div>
                          <div className="bg-pp-bg-surface rounded-lg p-2 text-center">
                            <div className="text-[9px] text-pp-text-muted">Bracket</div>
                            <div className="text-sm font-black text-pp-text">{breakdown.phase2Points}</div>
                          </div>
                          <div className="bg-pp-bg-surface rounded-lg p-2 text-center">
                            <div className="text-[9px] text-pp-text-muted">Total</div>
                            <div className="text-sm font-black text-pp-gold">{breakdown.totalPoints}</div>
                          </div>
                        </div>
                        {breakdown.concepts.map(c => (
                          <div key={c.conceptId}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-pp-bg-surface border border-pp-border/20 text-xs">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[9px] font-mono text-pp-text-muted">C{c.conceptId}</span>
                              <span className="truncate text-pp-text-secondary">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-[10px] text-pp-text-muted">{c.hits}/{c.evaluations}</span>
                              <span className={`font-bold ${c.totalPoints > 0 ? 'text-pp-gold' : 'text-pp-text-muted'}`}>
                                {c.totalPoints}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <div className="text-center py-4 text-pp-text-muted text-sm">Sin datos de puntaje.</div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}