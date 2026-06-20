'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, PageHeader, ScoreInput } from '@/components/ui';
import { updatePrediction, translateError } from '@/lib/api/client';
import type { BracketData, BracketSlot } from '@/lib/data/types';
import { BracketSummary } from './bracket-summary';
import { DownloadPDFButton } from '@/components/download-pdf-button';

const ROUND_LABELS: Record<BracketSlot['round'], string> = {
  R32: 'Dieciseisavos', R16: 'Octavos', QF: 'Cuartos', SF: 'Semis',
  THIRD: '3er Lugar', FINAL: 'Final',
};
const ROUND_ORDER: BracketSlot['round'][] = ['R16', 'QF', 'SF', 'THIRD', 'FINAL'];

const NEXT_ROUND: Record<string, BracketSlot['round'] | null> = {
  R16: 'QF', QF: 'SF', SF: 'THIRD', THIRD: 'FINAL', FINAL: null,
};

export function BracketClient({ initialData, matchSlotMap, entryId, entryDisplayName, entryLocked = false, entryStatus = 'DRAFT', completionPct = 0 }: {
  initialData: BracketData;
  matchSlotMap: Record<string, string>;
  entryId?: string;
  entryDisplayName?: string;
  entryLocked?: boolean;
  entryStatus?: string;
  completionPct?: number;
}) {
  const router = useRouter();
  const [activeRound, setActiveRound] = useState<BracketSlot['round']>('R16');
  const [viewMode, setViewMode] = useState<'predicted' | 'official'>('predicted');
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [savedSlots, setSavedSlots] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [phaseComplete, setPhaseComplete] = useState<string | null>(null);
  const phaseCompleteRef = useRef<HTMLDivElement>(null);
  
  const slots = viewMode === 'predicted' ? initialData.participantSlots : initialData.officialSlots;
  const roundSlots = slots.filter(s => s.round === activeRound);
  const allSlots = viewMode === 'predicted' ? initialData.participantSlots : initialData.officialSlots;
  const totalKnockoutSlots = allSlots.filter(s => s.homeTeam && s.awayTeam).length;
  const completedSlots = allSlots.filter(s => s.homeGoals != null && s.awayGoals != null).length;
  const finalSlot = allSlots.find(s => s.round === 'FINAL');
  const bracketComplete = finalSlot != null && finalSlot.homeGoals != null && finalSlot.awayGoals != null;

  const teamNames: Record<string, string> = {};
  for (const s of allSlots) {
    if (s.homeTeam) teamNames[s.homeTeam.id] = s.homeTeam.name;
    if (s.awayTeam) teamNames[s.awayTeam.id] = s.awayTeam.name;
  }

  const currentRoundSlots = allSlots.filter(s => s.round === activeRound && s.homeTeam && s.awayTeam);
  const currentRoundCompleted = currentRoundSlots.filter(s => s.homeGoals != null && s.awayGoals != null).length;
  const isCurrentRoundComplete = currentRoundSlots.length > 0 && currentRoundCompleted >= currentRoundSlots.length;
  
  // Detect phase completion from server data after refresh
  useEffect(() => {
    if (phaseComplete || recalculating) return;
    
    const ROUND_SLOT_COUNTS: Record<string, number> = {
      R16: 8, QF: 4, SF: 2, THIRD: 1, FINAL: 1,
    };
    const expected = ROUND_SLOT_COUNTS[activeRound] ?? 0;
    const roundSlotsWithTeams = slots.filter(s => s.round === activeRound && s.homeTeam && s.awayTeam);
    const completed = roundSlotsWithTeams.filter(s => s.homeGoals != null && s.awayGoals != null).length;

    if (expected > 0 && completed >= expected && savedSlots.size > 0) {
      setPhaseComplete(activeRound);
    }
  }, [initialData, activeRound, savedSlots]);
  
  useEffect(() => {
    if (phaseComplete && phaseCompleteRef.current) {
      setTimeout(() => {
        phaseCompleteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [phaseComplete]);

 

  const handleNextPhase = () => {
    const next = NEXT_ROUND[activeRound];
    if (next) {
      setActiveRound(next);
      setPhaseComplete(null);
      router.refresh();
    } else {
      setShowSummary(true);
      setPhaseComplete(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Bracket Eliminatorio" subtitle="Tu pronóstico vs el bracket oficial" />

      {!initialData.thirdPlaceMatrixResolved && viewMode === 'predicted' && (
        <Card accent="warning">
          <div className="text-xs text-pp-warning">
            ⚠ Completa todos los pronósticos de grupo para generar el bracket.
          </div>
        </Card>
      )}

      {error && (
        <Card accent="danger">
          <div className="text-xs text-pp-danger">{error}</div>
        </Card>
      )}

      {/* Recalculating overlay */}
      {recalculating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-pp-bg-surface border border-pp-gold/30 rounded-xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="flex justify-center">
              <svg className="animate-spin h-12 w-12 text-pp-gold" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div className="text-pp-gold font-bold text-lg">Recalculando puntajes</div>
            <div className="text-sm text-pp-text-muted">
              Por favor espere unos minutos mientras el sistema actualiza los puntajes de todos los participantes.
            </div>
            <div className="flex justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pp-gold animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-pp-gold animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-pp-gold animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Summary button */}
      {bracketComplete && !phaseComplete && (
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all
            bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep
            hover:brightness-110 shadow-gold"
        >
          {showSummary ? '← Volver al bracket' : '📊 Ver Resumen del Bracket'}
        </button>
      )}
      {/* Reminder to submit */}
      {bracketComplete && !entryLocked && entryStatus === 'DRAFT' && (
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-2 border-green-500/40 rounded-xl p-6 text-center space-y-3">
          <div className="text-2xl">📩</div>
          <div className="text-lg font-black text-green-400">
            ¡Tu quiniela está completa!
          </div>
          <div className="text-sm text-white font-semibold">
            Ahora debe enviar esta Quiniela. Presione el botón verde &quot;Enviar Quiniela&quot;.
          </div>
          
          <button
            onClick={async () => {
              if (!confirm('¿Estás seguro que deseas enviar tu quiniela? Una vez enviada no podrás hacer cambios.')) return;
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
                setError(err.message);
              }
            }}
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold
              bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg"
          >
            Enviar Quiniela
          </button>
        </div>
      )}
	  

      {/* Summary view */}
      {showSummary && (
        <>
          <BracketSummary
            slots={allSlots}
            teamNames={teamNames}
            entryId={entryId}
            entryStatus={entryStatus}
            completionPct={completionPct}
          />
          <div className="mt-4">
            <DownloadPDFButton
              entryId={entryId ?? ''}
              displayName={entryDisplayName ?? 'Quiniela'}
            />
          </div>
        </>
      )}

      {/* Regular bracket view */}
      {!showSummary && (
        <>
          {/* View toggle */}
          <div className="flex gap-2">
            <button onClick={() => setViewMode('predicted')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all
                ${viewMode === 'predicted'
                  ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                  : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border'}`}>
              Mi Pronóstico
            </button>
            <button onClick={() => setViewMode('official')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all
                ${viewMode === 'official'
                  ? 'bg-pp-info/20 text-pp-info border border-pp-info/30'
                  : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border'}`}>
              Bracket Real
            </button>
          </div>

          {/* Round tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {ROUND_ORDER.map(r => {
              const count = slots.filter(s => s.round === r).length;
              const completed = slots.filter(s => s.round === r && s.status === 'completed').length;
              return (
                <button
                  key={r}
                  onClick={() => { setActiveRound(r); setPhaseComplete(null); }}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all
                    ${activeRound === r
                      ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                      : 'bg-pp-bg-surface text-pp-text-secondary border border-pp-border'}`}
                >
                  {ROUND_LABELS[r]}
                  <span className="ml-1 text-[9px] opacity-60">{completed}/{count}</span>
                </button>
              );
            })}
          </div>

          {/* Slot cards */}
          <div className="space-y-3">
            {roundSlots.length === 0 ? (
              <Card className="text-center py-8">
                <div className="text-pp-text-muted text-sm">
                  {viewMode === 'predicted'
                    ? 'Completa la ronda anterior para desbloquear esta fase.'
                    : 'Los slots oficiales se resolverán durante el torneo.'}
                </div>
              </Card>
            ) : (
              roundSlots.map(slot => (
                <BracketSlotCard
                  key={slot.slotId}
                  slot={slot}
                  matchId={matchSlotMap[slot.slotId]}
                  canEdit={viewMode === 'predicted' && !!slot.homeTeam && !!slot.awayTeam && !slot.locked && !entryLocked}
                  isSaving={savingSlot === slot.slotId}
                  isSaved={savedSlots.has(slot.slotId)}
                  onSave={async (home, away, homePen, awayPen) => {
                    const matchId = matchSlotMap[slot.slotId];
                    if (!matchId) {
                      setError('No se encontró el partido para este slot');
                      return;
                    }
                    setError(null);
                    setSavingSlot(slot.slotId);
                    try {
                      const result = await updatePrediction({
                        matchId, homeGoals: home, awayGoals: away,
                        homePenalties: homePen, awayPenalties: awayPen,
                        entryId,
                      });

					setSavedSlots(prev => new Set(prev).add(slot.slotId));
                      router.refresh();
					  
                    } catch (err) {
                      setError(translateError(err));
                    } finally {
                      setSavingSlot(null);
                    }
                  }}
                />
              ))
            )}
          </div>
		  
		  {/* Hint for saving */}
          {viewMode === 'predicted' && roundSlots.length > 0 && !entryLocked && (
            <div className="text-sm text-white text-center font-bold px-4 py-3 bg-pp-bg-surface/50 rounded-lg border border-pp-border/30">
              Nota: para guardar el último resultado, presione TAB o toque cualquier parte de la pantalla fuera del recuadro de goles.
            </div>
          )}
		  
	{/* Phase complete notification */}
      {phaseComplete && !recalculating && (
            <div ref={phaseCompleteRef}>
            <Card accent="success">
          <div className="text-center space-y-3 py-2">
            <div className="text-pp-success font-bold">
              ✓ {ROUND_LABELS[phaseComplete as BracketSlot['round']] ?? phaseComplete} completada
            </div>
            <div className="text-xs text-pp-text-muted">
              Todos los pronósticos de esta fase han sido guardados.
            </div>
            {NEXT_ROUND[phaseComplete] ? (
              <button
                onClick={handleNextPhase}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all
                  bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep
                  hover:brightness-110 shadow-gold"
              >
                Siguiente Fase → {ROUND_LABELS[NEXT_ROUND[phaseComplete]!]}
              </button>
            ) : (
              <button
                onClick={() => { setShowSummary(true); setPhaseComplete(null); }}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all
                  bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep
                  hover:brightness-110 shadow-gold"
              >
                📊 Ver Resumen del Bracket
              </button>
            )}
          </div>
       </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BracketSlotCard({ slot, matchId, canEdit, isSaving, isSaved, onSave }: {
  slot: BracketSlot;
  matchId?: string;
  canEdit: boolean;
  isSaving: boolean;
  isSaved: boolean;
  onSave: (home: number, away: number, homePen?: number, awayPen?: number) => void;
}) {
  const [homeGoals, setHomeGoals] = useState<number | null>(slot.homeGoals);
  const [awayGoals, setAwayGoals] = useState<number | null>(slot.awayGoals);
  const [homePen, setHomePen] = useState<number | null>(slot.homePenalties);
  const [awayPen, setAwayPen] = useState<number | null>(slot.awayPenalties);

  const isTied = homeGoals != null && awayGoals != null && homeGoals === awayGoals;
  const needsPenalties = isTied;
  const canSaveNow = homeGoals != null && awayGoals != null && (!isTied || (homePen != null && awayPen != null && homePen !== awayPen));

  const hasChanged =
    homeGoals !== slot.homeGoals ||
    awayGoals !== slot.awayGoals ||
    homePen !== slot.homePenalties ||
    awayPen !== slot.awayPenalties;

  const handleBlur = () => {
    if (!canSaveNow || !hasChanged) return;
    onSave(homeGoals!, awayGoals!, needsPenalties ? homePen! : undefined, needsPenalties ? awayPen! : undefined);
  };

  const accent =
    slot.status === 'completed' ? 'success' :
    slot.status === 'invalidated' ? 'danger' :
    slot.status === 'unresolved' ? 'none' : 'warning';

  return (
    <Card accent={accent}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-pp-text-muted">{slot.slotId}</span>
        {isSaving && <Badge variant="info">Guardando...</Badge>}
        {isSaved && !isSaving && <Badge variant="success">✓ Guardado</Badge>}
        {!isSaving && !isSaved && slot.status === 'completed' && <Badge variant="success">Resuelto</Badge>}
        {slot.status === 'invalidated' && <Badge variant="danger">Invalidado</Badge>}
        {slot.status === 'unresolved' && <Badge variant="muted">Sin equipos</Badge>}
        {!isSaving && !isSaved && slot.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
        {slot.status === 'locked' && <Badge variant="muted">Cerrado</Badge>}
      </div>

      {!slot.homeTeam || !slot.awayTeam ? (
        <div className="text-center py-4 text-pp-text-muted text-xs">
          Equipos se determinan por resultados de la ronda anterior
        </div>
      ) : canEdit ? (
        <div className="space-y-3" onBlur={handleBlur}>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-semibold truncate">{slot.homeTeam.name}</span>
            </div>
            <ScoreInput value={homeGoals} onChange={setHomeGoals} />
            <span className="text-pp-text-muted text-xs font-bold">VS</span>
            <ScoreInput value={awayGoals} onChange={setAwayGoals} />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-semibold truncate">{slot.awayTeam.name}</span>
            </div>
          </div>

          {needsPenalties && (
            <div className="bg-pp-warning-dim/20 border border-pp-warning/20 rounded-lg p-3">
              <div className="text-[10px] text-pp-warning font-semibold text-center mb-2">
                Empate — define penales
              </div>
              <div className="flex items-center justify-center gap-3">
                <ScoreInput value={homePen} onChange={setHomePen} />
                <span className="text-pp-text-muted text-[10px]">PEN</span>
                <ScoreInput value={awayPen} onChange={setAwayPen} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <TeamRow
            name={slot.homeTeam.shortName}
            goals={slot.homeGoals}
            penalties={slot.homePenalties}
            isWinner={slot.winnerTeamId === slot.homeTeam.id}
          />
          <TeamRow
            name={slot.awayTeam.shortName}
            goals={slot.awayGoals}
            penalties={slot.awayPenalties}
            isWinner={slot.winnerTeamId === slot.awayTeam.id}
          />
        </div>
      )}

      {slot.pointsEarned != null && slot.pointsEarned > 0 && (
        <div className="text-right mt-2 pt-2 border-t border-pp-border/20">
          <span className="text-xs font-bold text-pp-gold">+{slot.pointsEarned} pts</span>
        </div>
      )}
    </Card>
  );
}

function TeamRow({ name, goals, penalties, isWinner }: {
  name: string; goals: number | null; penalties: number | null; isWinner: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-2 py-1.5 rounded-md
      ${isWinner ? 'bg-pp-success/5' : ''}`}>
      <span className={`text-sm ${isWinner ? 'font-bold' : ''}`}>{name}</span>
      {goals != null && (
        <span className={`font-mono font-bold text-sm ${isWinner ? 'text-pp-success' : 'text-pp-text-secondary'}`}>
          {goals}
          {penalties != null && <span className="text-[10px] text-pp-text-muted"> ({penalties})</span>}
        </span>
      )}
      {isWinner && <span className="text-xs ml-2">✓</span>}
    </div>
  );
}