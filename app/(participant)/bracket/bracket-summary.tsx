'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Badge, Button } from '@/components/ui';
import type { BracketSlot } from '@/lib/data/types';
import { BracketDisplay } from '@/app/admin/bracket/bracket-display';

interface Props {
  slots: BracketSlot[];
  teamNames: Record<string, string>;
  entryId?: string;
  entryStatus?: string;
  completionPct?: number;
}

export function BracketSummary({ slots, teamNames, entryId, entryStatus = 'DRAFT', completionPct = 0 }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const getSlot = (slotId: string) => slots.find(s => s.slotId === slotId);
  const teamName = (id: string | null) => id ? (teamNames[id] ?? '?') : 'TBD';

  const winner = (slot: BracketSlot | undefined): string | null => {
    if (!slot || slot.homeGoals == null || slot.awayGoals == null) return null;
    if (slot.homeGoals > slot.awayGoals) return slot.homeTeam?.id ?? null;
    if (slot.awayGoals > slot.homeGoals) return slot.awayTeam?.id ?? null;
    if (slot.homePenalties != null && slot.awayPenalties != null) {
      return slot.homePenalties > slot.awayPenalties
        ? slot.homeTeam?.id ?? null
        : slot.awayTeam?.id ?? null;
    }
    return null;
  };

  // Octavos quiniela: starts at R16, no R32
  const leftR16 = ['R16-02','R16-01','R16-06','R16-05'];
  const leftQF = ['QF-01','QF-02'];
  const leftSF = 'SF-01';

  const rightR16 = ['R16-03','R16-04','R16-08','R16-07'];
  const rightQF = ['QF-03','QF-04'];
  const rightSF = 'SF-02';

  const isDraft = entryStatus === 'DRAFT';
  const isSubmitted = entryStatus === 'SUBMITTED';
  const isApproved = entryStatus === 'APPROVED';
  const canSubmit = isDraft && completionPct >= 100;

  const handleSubmit = async () => {
    if (!confirm('¿Estás seguro que deseas enviar tu quiniela? Una vez enviada no podrás hacer cambios.')) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/entries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Resumen del Bracket" subtitle="Vista completa de tu pronóstico de octavos" />

      {/* Desktop: full bracket */}
      <div className="hidden lg:block">
            <BracketDisplay slots={slots} teamNames={teamNames} />
      </div>

      {/* Mobile: stacked */}
      <div className="lg:hidden space-y-6">
        <div>
          <div className="text-center text-xs font-bold text-pp-gold tracking-wider mb-2">⭐ FINAL</div>
          <MatchBox slot={getSlot('F-01')} teamNames={teamNames} winner={winner} highlight="gold" />
        </div>

        <div>
          <div className="text-center text-[10px] font-bold text-pp-text-muted tracking-wider mb-2">3ER LUGAR</div>
          <MatchBox slot={getSlot('3RD-01')} teamNames={teamNames} winner={winner} highlight="bronze" />
        </div>

        <RoundSection label="Semifinales" slots={[getSlot(leftSF), getSlot(rightSF)]} teamNames={teamNames} winner={winner} />
        <RoundSection label="Cuartos de Final" slots={[...leftQF, ...rightQF].map(getSlot)} teamNames={teamNames} winner={winner} />
        <RoundSection label="Octavos de Final" slots={[...leftR16, ...rightR16].map(getSlot)} teamNames={teamNames} winner={winner} />
      </div>

      {/* Champion banner */}
      {(() => {
        const finalSlot = getSlot('F-01');
        const champId = winner(finalSlot);
        if (!champId) return null;
        return (
          <div className="relative overflow-hidden rounded-xl border border-pp-gold/30 p-6 text-center"
            style={{ background: 'linear-gradient(150deg, rgba(107,29,42,0.5), rgba(8,12,24,1) 70%)' }}>
            <div className="text-[10px] text-pp-gold-light tracking-[4px] mb-2">TU CAMPEÓN</div>
            <div className="text-3xl font-black text-pp-gold">{teamName(champId)}</div>
            <div className="text-4xl mt-2">🏆</div>
          </div>
        );
      })()}

      {/* Status & Submit */}
      <Card accent={isApproved ? 'success' : isSubmitted ? 'info' : 'none'}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-pp-gold-light tracking-wider">ESTADO DE LA QUINIELA</div>
            {isDraft && <Badge variant="warning">Borrador</Badge>}
            {isSubmitted && <Badge variant="info">Enviada — Pendiente</Badge>}
            {isApproved && <Badge variant="success">Aprobada ✓</Badge>}
          </div>

          {isDraft && !canSubmit && (
            <div className="text-xs text-pp-text-muted">
              Completa tu quiniela al 100% para poder enviarla. Progreso: {completionPct}%
            </div>
          )}

          {canSubmit && (
            <div className="text-xs text-pp-success">
              ¡Tu quiniela está completa! Envíala para que sea revisada y aprobada.
            </div>
          )}

          {isSubmitted && (
            <div className="text-xs text-pp-text-muted">
              Tu quiniela está pendiente de aprobación por el administrador.
            </div>
          )}

          {isApproved && (
            <div className="text-xs text-pp-success">
              Tu quiniela ha sido aprobada y está participando oficialmente.
            </div>
          )}

          {submitError && (
            <div className="text-xs text-pp-danger bg-pp-danger/10 p-2 rounded">{submitError}</div>
          )}

          {isDraft && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all
                ${canSubmit
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border cursor-not-allowed opacity-50'}`}
            >
              {submitting ? 'Enviando...' : canSubmit ? '✓ Enviar Quiniela' : '🔒 Completa tu quiniela para enviar'}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// Sub-components

function BracketColumn({ slots, teamNames, winner, label, spacing = 'sm' }: {
  slots: (BracketSlot | undefined)[];
  teamNames: Record<string, string>;
  winner: (slot: BracketSlot | undefined) => string | null;
  label: string;
  spacing?: 'sm' | 'lg' | 'xl' | 'xxl';
}) {
  const gap = spacing === 'xxl' ? 'gap-48' : spacing === 'xl' ? 'gap-24' : spacing === 'lg' ? 'gap-12' : 'gap-2';
  return (
    <div>
      <div className="text-center text-[9px] text-pp-text-muted font-semibold tracking-wider mb-2">{label}</div>
      <div className={`flex flex-col ${gap}`}>
        {slots.map((slot, i) => (
          <MatchBox key={slot?.slotId ?? i} slot={slot} teamNames={teamNames} winner={winner} size="sm" />
        ))}
      </div>
    </div>
  );
}

function RoundSection({ label, slots, teamNames, winner }: {
  label: string;
  slots: (BracketSlot | undefined)[];
  teamNames: Record<string, string>;
  winner: (slot: BracketSlot | undefined) => string | null;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold text-pp-gold-light tracking-wider mb-2">{label}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.map((slot, i) => (
          <MatchBox key={slot?.slotId ?? i} slot={slot} teamNames={teamNames} winner={winner} />
        ))}
      </div>
    </div>
  );
}

function MatchBox({ slot, teamNames, winner, highlight, label, size = 'md' }: {
  slot: BracketSlot | undefined;
  teamNames: Record<string, string>;
  winner: (slot: BracketSlot | undefined) => string | null;
  highlight?: 'gold' | 'bronze';
  label?: string;
  size?: 'sm' | 'md';
}) {
  if (!slot) {
    return (
      <div className={`bg-pp-bg-surface border border-pp-border/30 rounded-md ${size === 'sm' ? 'p-1.5' : 'p-2'} opacity-40`}>
        <div className="text-[9px] text-pp-text-muted text-center">TBD</div>
      </div>
    );
  }

  const winnerId = winner(slot);
  const homeWon = winnerId === slot.homeTeam?.id;
  const awayWon = winnerId === slot.awayTeam?.id;
  const hasScore = slot.homeGoals != null && slot.awayGoals != null;

  const borderColor =
    highlight === 'gold' ? 'border-pp-gold/50' :
    highlight === 'bronze' ? 'border-pp-rank-bronze/50' :
    hasScore ? 'border-pp-success/30' : 'border-pp-border/30';

  const bgColor =
    highlight === 'gold' ? 'bg-pp-gold/5' :
    highlight === 'bronze' ? 'bg-pp-rank-bronze/5' :
    'bg-pp-bg-surface';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-md ${size === 'sm' ? 'p-1.5' : 'p-2.5'}`}>
      {label && <div className="text-[9px] text-pp-gold font-bold text-center mb-1">{label}</div>}
      <div className={`text-[9px] text-pp-text-muted text-center mb-1`}>{slot.slotId}</div>
      <TeamLine
        name={slot.homeTeam?.shortName ?? '?'}
        goals={slot.homeGoals}
        penalties={slot.homePenalties}
        isWinner={homeWon}
        size={size}
      />
      <TeamLine
        name={slot.awayTeam?.shortName ?? '?'}
        goals={slot.awayGoals}
        penalties={slot.awayPenalties}
        isWinner={awayWon}
        size={size}
      />
    </div>
  );
}

function TeamLine({ name, goals, penalties, isWinner, size }: {
  name: string; goals: number | null; penalties: number | null;
  isWinner: boolean; size: 'sm' | 'md';
}) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  return (
    <div className={`flex items-center justify-between px-1 py-0.5 rounded
      ${isWinner ? 'bg-pp-success/10' : ''}`}>
      <span className={`${textSize} ${isWinner ? 'font-bold text-pp-success' : 'text-pp-text-secondary'} truncate flex-1`}>
        {name}
      </span>
      {goals != null && (
        <span className={`${textSize} font-mono font-bold ml-2 ${isWinner ? 'text-pp-success' : 'text-pp-text-muted'}`}>
          {goals}
          {penalties != null && <span className="text-[8px] opacity-60">({penalties})</span>}
        </span>
      )}
    </div>
  );
}