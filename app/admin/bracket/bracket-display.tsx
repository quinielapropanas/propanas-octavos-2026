'use client';

import type { BracketSlot } from '@/lib/data/types';

interface Props {
  slots: BracketSlot[];
  teamNames: Record<string, string>;
}

export function BracketDisplay({ slots, teamNames }: Props) {
  const getSlot = (slotId: string) => slots.find(s => s.slotId === slotId);

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

  const leftR16 = ['R16-02','R16-01','R16-06','R16-05'];
  const leftQF = ['QF-01','QF-02'];
  const leftSF = 'SF-01';

  const rightR16 = ['R16-03','R16-04','R16-08','R16-07'];
  const rightQF = ['QF-03','QF-04'];
  const rightSF = 'SF-02';

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-7 gap-2 items-stretch">
            <RoundColumn slots={leftR16.map(getSlot)} winner={winner} label="Octavos" />
            <RoundColumn slots={leftQF.map(getSlot)} winner={winner} label="Cuartos" />
            <RoundColumn slots={[getSlot(leftSF)]} winner={winner} label="Semi" />
            <div className="flex flex-col justify-center items-center gap-4">
              <div className="text-center text-[10px] text-pp-gold font-bold tracking-wider">FINAL</div>
              <MatchBox slot={getSlot('F-01')} winner={winner} highlight="gold" />
              <div className="text-center text-[10px] text-pp-text-muted font-bold tracking-wider mt-4">3er Lugar</div>
              <MatchBox slot={getSlot('3RD-01')} winner={winner} highlight="bronze" />
            </div>
            <RoundColumn slots={[getSlot(rightSF)]} winner={winner} label="Semi" />
            <RoundColumn slots={rightQF.map(getSlot)} winner={winner} label="Cuartos" />
            <RoundColumn slots={rightR16.map(getSlot)} winner={winner} label="Octavos" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoundColumn({ slots, winner, label }: {
  slots: (BracketSlot | undefined)[];
  winner: (slot: BracketSlot | undefined) => string | null;
  label: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-center text-[9px] text-pp-text-muted font-semibold tracking-wider mb-2">{label}</div>
      <div className="flex flex-col justify-around flex-1" style={{ minHeight: '500px' }}>
        {slots.map((slot, i) => (
          <MatchBox key={slot?.slotId ?? i} slot={slot} winner={winner} />
        ))}
      </div>
    </div>
  );
}

function MatchBox({ slot, winner, highlight }: {
  slot: BracketSlot | undefined;
  winner: (slot: BracketSlot | undefined) => string | null;
  highlight?: 'gold' | 'bronze';
}) {
  if (!slot) {
    return (
      <div className="bg-pp-bg-surface border border-pp-border/30 rounded-md p-1.5 opacity-40 my-1">
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
    <div className={`${bgColor} border ${borderColor} rounded-md p-1.5 my-1`}>
      <div className="text-[8px] text-pp-text-muted text-center mb-1">{slot.slotId}</div>
      <TeamLine
        name={slot.homeTeam?.shortName ?? '?'}
        goals={slot.homeGoals}
        penalties={slot.homePenalties}
        isWinner={homeWon}
      />
      <TeamLine
        name={slot.awayTeam?.shortName ?? '?'}
        goals={slot.awayGoals}
        penalties={slot.awayPenalties}
        isWinner={awayWon}
      />
    </div>
  );
}

function TeamLine({ name, goals, penalties, isWinner }: {
  name: string; goals: number | null; penalties: number | null; isWinner: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-1 py-0.5 rounded ${isWinner ? 'bg-pp-success/10' : ''}`}>
      <span className={`text-[10px] ${isWinner ? 'font-bold text-pp-success' : 'text-pp-text-secondary'} truncate flex-1`}>
        {name}
      </span>
      {goals != null && (
        <span className={`text-[10px] font-mono font-bold ml-2 ${isWinner ? 'text-pp-success' : 'text-pp-text-muted'}`}>
          {goals}
          {penalties != null && <span className="text-[8px] opacity-60">({penalties})</span>}
        </span>
      )}
    </div>
  );
}