'use client';

import { PageHeader, Card, Badge } from '@/components/ui';
import type { BracketSlot } from '@/lib/data/types';

interface Props {
  slots: BracketSlot[];
  teamNames: Record<string, string>;
  totalSlots: number;
  resolvedSlots: number;
  resultsLoaded: number;
}

export function AdminBracketClient({ slots, teamNames, totalSlots, resolvedSlots, resultsLoaded }: Props) {
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

  const leftR32 = ['R32-01','R32-03','R32-02','R32-05','R32-04','R32-06','R32-07','R32-08'];
  const leftR16 = ['R16-01','R16-02','R16-05','R16-06'];
  const leftQF = ['QF-01','QF-02'];
  const leftSF = 'SF-01';

  const rightR32 = ['R32-11','R32-12','R32-09','R32-10','R32-13','R32-15','R32-14','R32-16'];
  const rightR16 = ['R16-03','R16-04','R16-07','R16-08'];
  const rightQF = ['QF-03','QF-04'];
  const rightSF = 'SF-02';

  return (
    <div className="space-y-6">
      <PageHeader title="Bracket Oficial" subtitle="Resultados oficiales de la fase eliminatoria" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Slots generados</div>
          <div className="text-2xl font-black text-pp-text mt-1">{totalSlots}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Resultados cargados</div>
          <div className="text-2xl font-black text-pp-gold mt-1">{resultsLoaded}/32</div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Ganadores resueltos</div>
          <div className="text-2xl font-black text-pp-success mt-1">{resolvedSlots}</div>
        </Card>
      </div>

      {totalSlots === 0 ? (
        <Card className="text-center py-8">
          <div className="text-pp-text-muted text-sm">
            El bracket oficial se genera al completar los 72 resultados de la fase de grupos.
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop: full bracket */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-[1100px] flex items-start gap-0">
              <div className="flex-1">
                <div className="text-center text-[10px] text-pp-gold-light font-bold tracking-wider mb-3">LLAVE A</div>
                <BracketColumn slots={leftR32.map(getSlot)} winner={winner} label="Dieciseisavos" />
              </div>
              <div className="w-40">
                <div className="h-6" />
                <BracketColumn slots={leftR16.map(getSlot)} winner={winner} label="Octavos" spacing="lg" />
              </div>
              <div className="w-36">
                <div className="h-6" />
                <BracketColumn slots={leftQF.map(getSlot)} winner={winner} label="Cuartos" spacing="xl" />
              </div>
              <div className="w-36">
                <div className="h-6" />
                <BracketColumn slots={[getSlot(leftSF)]} winner={winner} label="Semi" spacing="xxl" />
              </div>

              <div className="w-44 flex flex-col items-center justify-center pt-16">
                <MatchBox slot={getSlot('F-01')} winner={winner} highlight="gold" label="FINAL" />
                <div className="my-4" />
                <MatchBox slot={getSlot('3RD-01')} winner={winner} highlight="bronze" label="3er Lugar" />
              </div>

              <div className="w-36">
                <div className="h-6" />
                <BracketColumn slots={[getSlot(rightSF)]} winner={winner} label="Semi" spacing="xxl" />
              </div>
              <div className="w-36">
                <div className="h-6" />
                <BracketColumn slots={rightQF.map(getSlot)} winner={winner} label="Cuartos" spacing="xl" />
              </div>
              <div className="w-40">
                <div className="h-6" />
                <BracketColumn slots={rightR16.map(getSlot)} winner={winner} label="Octavos" spacing="lg" />
              </div>
              <div className="flex-1">
                <div className="text-center text-[10px] text-pp-gold-light font-bold tracking-wider mb-3">LLAVE B</div>
                <BracketColumn slots={rightR32.map(getSlot)} winner={winner} label="Dieciseisavos" />
              </div>
            </div>
          </div>

          {/* Mobile: stacked view */}
          <div className="lg:hidden space-y-6">
            <div>
              <div className="text-center text-xs font-bold text-pp-gold tracking-wider mb-2">FINAL</div>
              <MatchBox slot={getSlot('F-01')} winner={winner} highlight="gold" />
            </div>
            <div>
              <div className="text-center text-[10px] font-bold text-pp-text-muted tracking-wider mb-2">3ER LUGAR</div>
              <MatchBox slot={getSlot('3RD-01')} winner={winner} highlight="bronze" />
            </div>
            <RoundSection label="Semifinales" slots={[getSlot(leftSF), getSlot(rightSF)]} winner={winner} />
            <RoundSection label="Cuartos de Final" slots={[...leftQF, ...rightQF].map(getSlot)} winner={winner} />
            <RoundSection label="Octavos de Final" slots={[...leftR16, ...rightR16].map(getSlot)} winner={winner} />
            <RoundSection label="Dieciseisavos" slots={[...leftR32, ...rightR32].map(getSlot)} winner={winner} />
          </div>

          {/* Champion banner */}
          {(() => {
            const finalSlot = getSlot('F-01');
            const champId = winner(finalSlot);
            if (!champId) return null;
            return (
              <div className="relative overflow-hidden rounded-xl border border-pp-gold/30 p-6 text-center"
                style={{ background: 'linear-gradient(150deg, rgba(107,29,42,0.5), rgba(8,12,24,1) 70%)' }}>
                <div className="text-[10px] text-pp-gold-light tracking-[4px] mb-2">CAMPEÓN OFICIAL</div>
                <div className="text-3xl font-black text-pp-gold">{teamName(champId)}</div>
                <div className="text-4xl mt-2">🏆</div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function BracketColumn({ slots, winner, label, spacing = 'sm' }: {
  slots: (BracketSlot | undefined)[];
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
          <MatchBox key={slot?.slotId ?? i} slot={slot} winner={winner} size="sm" />
        ))}
      </div>
    </div>
  );
}

function RoundSection({ label, slots, winner }: {
  label: string;
  slots: (BracketSlot | undefined)[];
  winner: (slot: BracketSlot | undefined) => string | null;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold text-pp-gold-light tracking-wider mb-2">{label}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.map((slot, i) => (
          <MatchBox key={slot?.slotId ?? i} slot={slot} winner={winner} />
        ))}
      </div>
    </div>
  );
}

function MatchBox({ slot, winner, highlight, label, size = 'md' }: {
  slot: BracketSlot | undefined;
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
      <div className="text-[9px] text-pp-text-muted text-center mb-1">{slot.slotId}</div>
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
    <div className={`flex items-center justify-between px-1 py-0.5 rounded ${isWinner ? 'bg-pp-success/10' : ''}`}>
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