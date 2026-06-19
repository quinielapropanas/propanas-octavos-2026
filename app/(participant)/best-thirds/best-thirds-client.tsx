'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Badge, Button } from '@/components/ui';
import React from 'react';

interface ThirdTeam {
  teamId: string;
  groupLetter: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  qualifies?: boolean;
  team: {
    id: string;
    name: string;
    shortName: string;
    groupLetter: string;
  } | null;
}

export function BestThirdsClient({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [thirds, setThirds] = useState<ThirdTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetch(`/api/entries/best-thirds?entryId=${entryId}`)
      .then(r => r.json())
      .then(data => {
        if (data.thirds) {
          setThirds(data.thirds);
          setConfirmed(data.confirmed);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entryId]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...thirds];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setThirds(newList);
    setHasChanges(true);
  };

  const moveDown = (index: number) => {
    if (index >= thirds.length - 1) return;
    const newList = [...thirds];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setThirds(newList);
    setHasChanges(true);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/entries/best-thirds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId,
          ranking: thirds.map((t, i) => ({
            teamId: t.teamId,
            groupLetter: t.groupLetter,
            points: t.points,
            goalDifference: t.goalDifference,
            goalsFor: t.goalsFor,
            qualifies: i < 8,
          })),
          resetBracket: confirmed && hasChanges,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmed(true);
        setHasChanges(false);
        setTimeout(() => {
          router.push(`/bracket?entry=${entryId}`);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-pp-text-muted text-sm">Cargando mejores terceros...</div>
      </div>
    );
  }

  if (thirds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mejores Terceros" subtitle="Completa la fase de grupos para ver los terceros" />
        <Card className="text-center py-8">
          <div className="text-pp-text-muted text-sm">
            Los mejores terceros se calculan al completar los 72 pronósticos de grupo.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mejores Terceros"
        subtitle="Ordena los 12 terceros de grupo. Los primeros 8 clasifican a dieciseisavos."
      />

      {confirmed && !hasChanges && (
        <Card accent="success">
          <div className="flex items-center gap-2">
            <Badge variant="success">Confirmado ✓</Badge>
            <span className="text-xs text-pp-text-muted">
              El orden fue confirmado y el bracket generado
            </span>
          </div>
        </Card>
      )}

      {confirmed && hasChanges && (
        <Card accent="warning">
          <div className="flex items-center gap-2">
            <Badge variant="warning">Cambios sin confirmar</Badge>
            <span className="text-xs text-pp-text-muted">
              Al confirmar se resetearán los pronósticos del bracket
            </span>
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-1">
          {thirds.map((t, index) => {
            const qualifies = index < 8;
            return (
              <React.Fragment key={t.teamId}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${qualifies
                      ? 'bg-pp-success/10 border border-pp-success/20'
                      : 'bg-pp-danger/5 border border-pp-danger/10'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                    ${qualifies ? 'bg-pp-success/20 text-pp-success' : 'bg-pp-danger/10 text-pp-danger'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${qualifies ? 'text-pp-text' : 'text-pp-text-muted'}`}>
                      {t.team?.name ?? t.teamId}
                    </div>
                    <div className="text-[10px] text-pp-text-muted">
                      Grupo {t.groupLetter} • {t.points} pts • DG: {t.goalDifference > 0 ? '+' : ''}{t.goalDifference} • GF: {t.goalsFor}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {qualifies ? (
                      <Badge variant="success">Clasifica</Badge>
                    ) : (
                      <Badge variant="danger">Eliminado</Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="w-6 h-6 flex items-center justify-center rounded text-[10px]
                        bg-pp-bg-card border border-pp-border text-pp-text-secondary
                        hover:bg-pp-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index >= thirds.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded text-[10px]
                        bg-pp-bg-card border border-pp-border text-pp-text-secondary
                        hover:bg-pp-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      ▼
                    </button>
                  </div>
                </div>
                {index === 7 && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-pp-gold/30" />
                    <span className="text-[10px] text-pp-gold font-semibold">↑ Clasifican a 16avos ↑</span>
                    <div className="flex-1 h-px bg-pp-gold/30" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </Card>

      {/* Action buttons */}
      {(!confirmed || hasChanges) && (
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all
            bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep
            hover:brightness-110 shadow-gold disabled:opacity-50"
        >
          {saving
            ? 'Confirmando...'
            : confirmed && hasChanges
              ? 'Confirmar cambios y regenerar bracket'
              : 'Confirmar orden y generar bracket'}
        </button>
      )}

      {confirmed && !hasChanges && (
        <button
          onClick={() => router.push(`/bracket?entry=${entryId}`)}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all
            bg-pp-bg-surface text-pp-gold border border-pp-gold/30
            hover:bg-pp-gold/10"
        >
          Ver bracket →
        </button>
      )}
    </div>
  );
}