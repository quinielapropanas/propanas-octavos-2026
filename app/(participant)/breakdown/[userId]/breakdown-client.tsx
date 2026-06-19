'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Badge } from '@/components/ui';

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

export function BreakdownClient({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedConcept, setExpandedConcept] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/breakdown?entryId=${entryId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setData(null);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-pp-text-muted text-sm">Cargando desglose...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Desglose de Puntos" />
        <Card className="text-center py-8">
          <div className="text-pp-text-muted text-sm">No se encontraron datos para esta quiniela.</div>
        </Card>
        <button onClick={() => router.back()}
          className="w-full py-3 rounded-xl text-sm font-bold bg-pp-bg-surface text-pp-gold border border-pp-gold/30 hover:bg-pp-gold/10">
          ← Volver al ranking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.entry.displayName ?? 'Quiniela'}
        subtitle="Desglose de puntos por concepto"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Posición</div>
          <div className="text-2xl font-black text-pp-gold mt-1">{data.position ?? '–'}°</div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Total</div>
          <div className="text-2xl font-black text-pp-success mt-1">{data.totalPoints}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Fases</div>
          <div className="text-xs mt-2">
            <div className="text-pp-text-secondary">Grupos: <span className="font-bold text-pp-text">{data.phase1Points}</span></div>
            <div className="text-pp-text-secondary">Bracket: <span className="font-bold text-pp-text">{data.phase2Points}</span></div>
          </div>
        </Card>
      </div>

      {/* Concept breakdown */}
      <div className="space-y-2">
        {data.concepts.map(c => (
          <Card key={c.conceptId}>
            <button
              onClick={() => setExpandedConcept(expandedConcept === c.conceptId ? null : c.conceptId)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-pp-text-muted bg-pp-bg-surface px-1.5 py-0.5 rounded">
                      C{c.conceptId}
                    </span>
                    <span className="text-sm font-semibold truncate">{c.name}</span>
                  </div>
                  <div className="text-[10px] text-pp-text-muted mt-1">
                    {c.hits} acierto{c.hits !== 1 ? 's' : ''} de {c.evaluations} evaluaciones • {c.pointsPerHit} pts c/u
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-lg font-black ${c.totalPoints > 0 ? 'text-pp-gold' : 'text-pp-text-muted'}`}>
                    {c.totalPoints}
                  </span>
                  <span className="text-[10px] text-pp-text-muted">
                    {expandedConcept === c.conceptId ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded details */}
            {expandedConcept === c.conceptId && c.details.length > 0 && (
              <div className="mt-3 pt-3 border-t border-pp-border/20 space-y-1.5">
                {c.details.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded bg-pp-bg-surface text-[11px]">
                    <span className="text-pp-text-secondary flex-1 truncate">{d.explanation}</span>
                    <span className="font-bold text-pp-success ml-2 flex-shrink-0">+{d.pointsAwarded}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Total bar */}
      <Card accent="success">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">TOTAL</span>
          <span className="text-2xl font-black text-pp-gold">{data.totalPoints} pts</span>
        </div>
      </Card>

      <button
        onClick={() => router.back()}
        className="w-full py-3 rounded-xl text-sm font-bold bg-pp-bg-surface text-pp-gold border border-pp-gold/30 hover:bg-pp-gold/10"
      >
        ← Volver al ranking
      </button>
    </div>
  );
}