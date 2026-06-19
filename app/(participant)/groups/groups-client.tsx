// ═══════════════════════════════════════════════════════════
// GroupsClient — Interactive predictions form
// Handles: score inputs, cascade confirmation, optimistic updates
// ═══════════════════════════════════════════════════════════
'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GroupSelector, MatchCard, StandingsTable, PageHeader, Badge,
  CascadeModal, Card, Button,
} from '@/components/ui';
import { updatePrediction, translateError, type CascadePreview } from '@/lib/api/client';
import type { GroupData, GroupMatchWithPrediction, TeamBrief } from '@/lib/data/types';

interface Props {
  initialGroup: string;
  initialData: GroupData;
  completionMap: Record<string, boolean>;
}

export function GroupsClient({ initialGroup, initialData, completionMap }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEntryId = searchParams?.get('entry') ?? undefined;
  const [isPending, startTransition] = useTransition();

  const [scores, setScores] = useState<Record<string, { home: number | null; away: number | null }>>(
    () => {
      const initial: Record<string, { home: number | null; away: number | null }> = {};
      for (const m of initialData.matches) {
        initial[m.match.id] = {
          home: m.prediction?.homeGoals ?? null,
          away: m.prediction?.awayGoals ?? null,
        };
      }
      return initial;
    }
  );

  const [error, setError] = useState<string | null>(null);
  const [pendingCascade, setPendingCascade] = useState<{
    matchId: string;
    input: { homeGoals: number; awayGoals: number };
    preview: CascadePreview['cascade'];
  } | null>(null);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [savedMatches, setSavedMatches] = useState<Set<string>>(new Set());

  const groups = 'ABCDEFGHIJKL'.split('');

  // Check if ALL 12 groups are complete (edit mode)
  const allGroupsComplete = groups.every(g => completionMap[g]);

  // Check if current group is complete
  const currentGroupComplete = completionMap[initialGroup] ?? false;

  // Find next incomplete group
  const currentGroupIndex = groups.indexOf(initialGroup);
  const nextGroup = groups.find((g, i) => i > currentGroupIndex && !completionMap[g]);
  const hasNextGroup = nextGroup != null;

  const handleGroupChange = (newGroup: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('group', newGroup);
      if (activeEntryId && !params.has('entry')) {
        params.set('entry', activeEntryId);
      }
      router.push(`/groups?${params.toString()}`);
    });
  };

  const handleNextGroup = () => {
    if (nextGroup) {
      handleGroupChange(nextGroup);
    } else if (allGroupsComplete) {
      router.push(`/best-thirds?entry=${activeEntryId}&mode=edit`);
    }
  };
  
  const handleScoreChange = (matchId: string, side: 'home' | 'away', val: number | null) => {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: val },
    }));
    setSavedMatches(prev => {
      const next = new Set(prev);
      next.delete(matchId);
      return next;
    });
  };

  const savePrediction = async (
    matchId: string,
    homeGoals: number,
    awayGoals: number,
    confirmCascade = false,
  ) => {
    setError(null);
    setSavingMatch(matchId);

    try {
      const result = await updatePrediction({
        matchId, homeGoals, awayGoals, confirmCascade,
        entryId: activeEntryId,
      });

      if ('requiresConfirmation' in result && result.requiresConfirmation) {
        setPendingCascade({
          matchId,
          input: { homeGoals, awayGoals },
          preview: result.cascade,
        });
        return;
      }

      setSavedMatches(prev => new Set(prev).add(matchId));
      router.refresh();

      // Check if bracket was generated (groups complete)
      if ('requiresConfirmation' in result) return;
      const data = result as any;
      if (data.bracketUpdate?.redirectTo) {
        router.push(data.bracketUpdate.redirectTo);
        return;
      }
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSavingMatch(null);
    }
  };

  const handleBlur = (match: GroupMatchWithPrediction) => {
    const current = scores[match.match.id];
    if (current?.home == null || current?.away == null) return;
    if (match.locked || initialData.locked) return;

    const unchanged =
      match.prediction?.homeGoals === current.home &&
      match.prediction?.awayGoals === current.away;
    if (unchanged) return;

    savePrediction(match.match.id, current.home, current.away);
  };

  const confirmCascade = async () => {
    if (!pendingCascade) return;
    const { matchId, input } = pendingCascade;
    setPendingCascade(null);
    await savePrediction(matchId, input.homeGoals, input.awayGoals, true);
  };

  const teamLookup = new Map<string, TeamBrief>();
  initialData.teams.forEach(t => teamLookup.set(t.id, t));

  // Count predictions for current group (including unsaved)
  const currentPredicted = initialData.matches.filter(m => {
    const s = scores[m.match.id];
    return s?.home != null && s?.away != null;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Fase de Grupos" subtitle="Ingresa tus pronósticos para cada grupo" />

      <GroupSelector
        groups={groups}
        selected={initialGroup}
        onSelect={handleGroupChange}
        completion={completionMap}
        allGroupsComplete={allGroupsComplete}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">Grupo {initialGroup}</span>
          <Badge variant={currentGroupComplete ? 'success' : 'warning'}>
            {currentPredicted}/{initialData.matches.length} completado
          </Badge>
        </div>
        {initialData.locked && <Badge variant="muted">Quiniela cerrada</Badge>}
      </div>

      {error && (
        <Card accent="danger">
          <div className="text-xs text-pp-danger">{error}</div>
        </Card>
      )}

      <div className="space-y-3">
        {initialData.matches.map(m => {
          const current = scores[m.match.id];
          const isSaving = savingMatch === m.match.id;
          const isSaved = savedMatches.has(m.match.id);
          const status: 'pending' | 'completed' | 'invalidated' | 'locked' | 'official' =
            m.prediction?.status === 'INVALIDATED_BY_CASCADE' ? 'invalidated' :
            (m.locked || initialData.locked) ? 'locked' :
            m.result ? 'official' :
            current?.home != null && current?.away != null ? 'completed' :
            'pending';

          return (
            <div key={m.match.id} onBlur={() => handleBlur(m)}>
              <MatchCard
                matchNumber={m.match.matchNumber}
                homeTeam={{
                  name: m.match.homeTeam?.name ?? '?',
                  flag: flagFor(m.match.homeTeam),
                }}
                awayTeam={{
                  name: m.match.awayTeam?.name ?? '?',
                  flag: flagFor(m.match.awayTeam),
                }}
                homeGoals={current?.home ?? null}
                awayGoals={current?.away ?? null}
                onHomeChange={(v) => handleScoreChange(m.match.id, 'home', v)}
                onAwayChange={(v) => handleScoreChange(m.match.id, 'away', v)}
                status={status}
                date={formatDate(m.match.scheduledAt)}
                venue={m.match.venue}
                officialScore={m.result ? { home: m.result.homeGoals, away: m.result.awayGoals } : null}
                pointsAwarded={m.pointsEarned ?? undefined}
              />
              {isSaving && (
                <div className="text-[10px] text-pp-info mt-1 text-center">Guardando...</div>
              )}
              {isSaved && !isSaving && (
                <div className="text-[10px] text-pp-success mt-1 text-center">✓ Guardado</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next group button */}
      {currentGroupComplete && (
        <button
          onClick={handleNextGroup}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all
            bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep
            hover:brightness-110 shadow-gold"
        >
          {hasNextGroup
            ? `Siguiente Grupo → ${nextGroup}`
            : allGroupsComplete
              ? 'Confirmar Mejores Terceros →'
              : `Siguiente Grupo →`}
        </button>
      )}
	  
	{/* Hint for saving */}
      {!initialData.locked && (
        <div className="text-sm text-white text-center font-bold px-4 py-3 bg-pp-bg-surface/50 rounded-lg border border-pp-border/30">
          Nota: para guardar el último resultado, presione TAB o toque cualquier parte de la pantalla fuera del recuadro de goles.
        </div>
      )}
	  
      {initialData.participantStandings && (
        <div>
          <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">
            TABLA DE POSICIONES — GRUPO {initialGroup}
          </div>
          <StandingsTable
            rows={initialData.participantStandings.map(s => {
              const team = teamLookup.get(s.teamId);
              return {
                teamName: team?.shortName ?? '?',
                flag: flagFor(team),
                pos: s.position,
                jj: s.played, jg: s.won, je: s.drawn, jp: s.lost,
                gf: s.goalsFor, gc: s.goalsAgainst, gd: s.goalDifference,
                pts: s.points,
              };
            })}
          />
        </div>
      )}

      {pendingCascade && (
        <CascadeModal
          affectedSlots={pendingCascade.preview.affectedSlotIds}
          onConfirm={confirmCascade}
          onCancel={() => setPendingCascade(null)}
        />
      )}
    </div>
  );
}

function flagFor(team: TeamBrief | null | undefined): string {
  if (!team?.flagAssetKey) return '🏳️';
  return flagEmoji(team.shortName);
}

function flagEmoji(code: string): string {
  const map: Record<string, string> = {
    MEX: '🇲🇽', RSA: '🇿🇦', KOR: '🇰🇷', CZE: '🇨🇿',
    CAN: '🇨🇦', BIH: '🇧🇦', QAT: '🇶🇦', SUI: '🇨🇭',
    BRA: '🇧🇷', MAR: '🇲🇦', HAI: '🇭🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    USA: '🇺🇸', PAR: '🇵🇾', AUS: '🇦🇺', TUR: '🇹🇷',
    GER: '🇩🇪', CUW: '🇨🇼', CIV: '🇨🇮', ECU: '🇪🇨',
    NED: '🇳🇱', JPN: '🇯🇵', SWE: '🇸🇪', TUN: '🇹🇳',
    BEL: '🇧🇪', EGY: '🇪🇬', IRN: '🇮🇷', NZL: '🇳🇿',
    ESP: '🇪🇸', CPV: '🇨🇻', KSA: '🇸🇦', URU: '🇺🇾',
    FRA: '🇫🇷', SEN: '🇸🇳', IRQ: '🇮🇶', NOR: '🇳🇴',
    ARG: '🇦🇷', ALG: '🇩🇿', AUT: '🇦🇹', JOR: '🇯🇴',
    POR: '🇵🇹', COD: '🇨🇩', UZB: '🇺🇿', COL: '🇨🇴',
    ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', CRO: '🇭🇷', GHA: '🇬🇭', PAN: '🇵🇦',
  };
  return map[code] ?? '🏳️';
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}
