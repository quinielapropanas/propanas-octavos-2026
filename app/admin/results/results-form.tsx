// ═══════════════════════════════════════════════════════════
// ResultsForm — Admin loads/edits official results
// ═══════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, PageHeader, ScoreInput } from '@/components/ui';
import { loadResult, triggerRebuild, translateError } from '@/lib/api/client';
import type { PendingMatchRow } from '@/lib/data/types';

interface LoadedResult {
  matchId: string;
  matchNumber: number;
  phase: string;
  groupLetter: string | null;
  slotId: string | null;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  homePenalties: number | null;
  awayPenalties: number | null;
  loadedAt: Date;
}

const PHASE_LABELS: Record<string, string> = {
  ALL: 'Todos',
  GROUP: 'Grupos',
  R32: 'Dieciseisavos',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semis',
  THIRD: '3er Lugar',
  FINAL: 'Final',
};

export function ResultsForm({
  pendingMatches,
  loadedResults = [],
}: {
  pendingMatches: PendingMatchRow[];
  loadedResults?: LoadedResult[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [homeGoals, setHomeGoals] = useState<number | null>(null);
  const [awayGoals, setAwayGoals] = useState<number | null>(null);
  const [homePen, setHomePen] = useState<number | null>(null);
  const [awayPen, setAwayPen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'loaded'>('pending');
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [editingResult, setEditingResult] = useState<LoadedResult | null>(null);
  const [editHome, setEditHome] = useState<number | null>(null);
  const [editAway, setEditAway] = useState<number | null>(null);
  const [editHomePen, setEditHomePen] = useState<number | null>(null);
  const [editAwayPen, setEditAwayPen] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastResult, setLastResult] = useState<{
    matchNumber: number; participantsScored: number; elapsedMs: number;
  } | null>(null);

  const match = pendingMatches.find(m => m.id === selected);
  const isKnockout = match?.phase !== 'GROUP';
  const isTied = homeGoals != null && awayGoals != null && homeGoals === awayGoals;
  const needsPenalties = isKnockout && isTied;

  // Edit state
  const editIsKnockout = editingResult?.phase !== 'GROUP';
  const editIsTied = editHome != null && editAway != null && editHome === editAway;
  const editNeedsPenalties = editIsKnockout && editIsTied;

  const reset = () => {
    setSelected(null);
    setHomeGoals(null); setAwayGoals(null);
    setHomePen(null); setAwayPen(null);
    setError(null);
  };

  const resetEdit = () => {
    setEditingResult(null);
    setEditHome(null); setEditAway(null);
    setEditHomePen(null); setEditAwayPen(null);
    setShowConfirm(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!match || homeGoals == null || awayGoals == null) return;
    if (needsPenalties && (homePen == null || awayPen == null)) {
      setError('Los penales son obligatorios en eliminatoria con empate');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await loadResult({
        matchId: match.id,
        homeGoals, awayGoals,
        homePenalties: needsPenalties ? homePen! : undefined,
        awayPenalties: needsPenalties ? awayPen! : undefined,
      });
      setLastResult({
        matchNumber: result.matchNumber,
        participantsScored: result.participantsScored,
        elapsedMs: result.elapsedMs,
      });
      reset();
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (r: LoadedResult) => {
    setEditingResult(r);
    setEditHome(r.homeGoals);
    setEditAway(r.awayGoals);
    setEditHomePen(r.homePenalties);
    setEditAwayPen(r.awayPenalties);
    setShowConfirm(false);
    setError(null);
  };

  const handleEditSave = async () => {
    if (!editingResult || editHome == null || editAway == null) return;
    if (editNeedsPenalties && (editHomePen == null || editAwayPen == null)) {
      setError('Los penales son obligatorios en eliminatoria con empate');
      return;
    }

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await loadResult({
        matchId: editingResult.matchId,
        homeGoals: editHome,
        awayGoals: editAway,
        homePenalties: editNeedsPenalties ? editHomePen! : undefined,
        awayPenalties: editNeedsPenalties ? editAwayPen! : undefined,
      });
      setLastResult({
        matchNumber: result.matchNumber,
        participantsScored: result.participantsScored,
        elapsedMs: result.elapsedMs,
      });
      resetEdit();
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    setError(null);
    try {
      const result = await triggerRebuild();
      setLastResult({
        matchNumber: 0,
        participantsScored: result.participantsScored,
        elapsedMs: result.elapsedMs,
      });
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setRebuilding(false);
    }
  };

  // Filter loaded results by phase
  const filteredResults = phaseFilter === 'ALL'
    ? loadedResults
    : loadedResults.filter(r => r.phase === phaseFilter);

  const loadedPhases = ['ALL', ...new Set(loadedResults.map(r => r.phase))];

  return (
    <div className="space-y-6">
      <PageHeader title="Resultados Oficiales" subtitle="Carga, edita resultados y gestiona recalculos" />

      {lastResult && (
        <Card accent="success">
          <div className="flex items-center gap-2">
            <Badge variant="success">
              {lastResult.matchNumber > 0 ? 'Resultado guardado' : 'Recalculo completo'}
            </Badge>
            <span className="text-xs text-pp-text-muted">
              {lastResult.matchNumber > 0 && `M${lastResult.matchNumber} • `}
              {lastResult.participantsScored} participantes recalculados en {lastResult.elapsedMs}ms
            </span>
          </div>
        </Card>
      )}

      {error && (
        <Card accent="danger">
          <div className="text-xs text-pp-danger">{error}</div>
        </Card>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab('pending'); resetEdit(); }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all
            ${activeTab === 'pending'
              ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
              : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border'}`}
        >
          Pendientes ({pendingMatches.length})
        </button>
        <button
          onClick={() => { setActiveTab('loaded'); reset(); }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all
            ${activeTab === 'loaded'
              ? 'bg-pp-success/20 text-pp-success border border-pp-success/30'
              : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border'}`}
        >
          Cargados ({loadedResults.length})
        </button>
      </div>

      {/* ─── PENDING TAB ─── */}
      {activeTab === 'pending' && (
        <>
          <div>
            <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">
              PARTIDOS PENDIENTES ({pendingMatches.length})
            </div>
            {pendingMatches.length === 0 ? (
              <Card className="text-center py-6">
                <div className="text-pp-text-muted text-sm">
                  Todos los partidos tienen resultado oficial.
                </div>
              </Card>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingMatches.slice(0, 20).map(m => (
                  <Card
                    key={m.id}
                    accent={selected === m.id ? 'info' : 'none'}
                    onClick={() => {
                      setSelected(m.id);
                      setHomeGoals(null); setAwayGoals(null);
                      setHomePen(null); setAwayPen(null);
                      setError(null);
                    }}
                    className={`cursor-pointer ${selected === m.id ? '!border-pp-info/50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-pp-text-muted mr-2">M{m.matchNumber}</span>
                        <Badge variant="muted">{m.phase}{m.groupLetter ? ` ${m.groupLetter}` : ''}</Badge>
                        <div className="text-sm font-semibold mt-1">
                          {m.homeTeam?.name ?? m.homeOrigin ?? '?'}
                          <span className="text-pp-text-muted mx-2">vs</span>
                          {m.awayTeam?.name ?? m.awayOrigin ?? '?'}
                        </div>
                      </div>
                      <div className="text-[10px] text-pp-text-muted text-right">
                        {formatDate(m.scheduledAt)}
                        <div>{m.city}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {match && (
            <Card accent="info" className="space-y-5 !border-pp-info/30">
              <div className="text-center">
                <div className="text-[10px] text-pp-info tracking-wider mb-1">CARGAR RESULTADO</div>
                <div className="text-sm font-bold">
                  {match.homeTeam?.name ?? '?'} vs {match.awayTeam?.name ?? '?'}
                </div>
                <div className="text-[10px] text-pp-text-muted">M{match.matchNumber} • {match.slotId}</div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-[10px] text-pp-text-muted mb-1">Local</div>
                  <input type="number" min="0" max="20" value={homeGoals ?? ''}
                    onChange={e => setHomeGoals(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-16 h-16 text-center text-3xl font-black rounded-lg bg-pp-bg-surface border-2 border-pp-border text-pp-text focus:border-pp-gold focus:outline-none" />
                </div>
                <span className="text-pp-text-muted text-sm font-bold mt-5">–</span>
                <div className="text-center">
                  <div className="text-[10px] text-pp-text-muted mb-1">Visitante</div>
                  <input type="number" min="0" max="20" value={awayGoals ?? ''}
                    onChange={e => setAwayGoals(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-16 h-16 text-center text-3xl font-black rounded-lg bg-pp-bg-surface border-2 border-pp-border text-pp-text focus:border-pp-gold focus:outline-none" />
                </div>
              </div>
              {needsPenalties && (
                <div className="bg-pp-warning-dim/20 border border-pp-warning/20 rounded-lg p-4 space-y-3">
                  <div className="text-xs text-pp-warning font-semibold text-center">Empate en eliminatoria — penales obligatorios</div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-[10px] text-pp-text-muted mb-1">Pen. Local</div>
                      <ScoreInput value={homePen} onChange={setHomePen} />
                    </div>
                    <span className="text-pp-text-muted text-xs mt-4">–</span>
                    <div className="text-center">
                      <div className="text-[10px] text-pp-text-muted mb-1">Pen. Visitante</div>
                      <ScoreInput value={awayPen} onChange={setAwayPen} />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={reset}>Cancelar</Button>
                <Button variant="primary" className="flex-[2]" loading={saving}
                  disabled={homeGoals == null || awayGoals == null || (needsPenalties && (homePen == null || awayPen == null))}
                  onClick={handleSave}>
                  Guardar
                </Button>
              </div>
            </Card>
          )}

          <Button variant="secondary" className="w-full" loading={rebuilding} onClick={handleRebuild}>
            Recalculo completo
          </Button>
        </>
      )}

      {/* ─── LOADED TAB ─── */}
      {activeTab === 'loaded' && (
        <div className="space-y-4">
          {/* Phase filter */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {loadedPhases.map(phase => (
              <button
                key={phase}
                onClick={() => setPhaseFilter(phase)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                  ${phaseFilter === phase
                    ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                    : 'bg-pp-bg-surface text-pp-text-secondary border border-pp-border'}`}
              >
                {PHASE_LABELS[phase] ?? phase}
                {phase !== 'ALL' && (
                  <span className="ml-1 text-[9px] opacity-60">
                    {loadedResults.filter(r => r.phase === phase).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-pp-success tracking-wider">
            {filteredResults.length} RESULTADO{filteredResults.length !== 1 ? 'S' : ''} CARGADO{filteredResults.length !== 1 ? 'S' : ''}
          </div>

          {filteredResults.length === 0 ? (
            <Card className="text-center py-6">
              <div className="text-pp-text-muted text-sm">No hay resultados cargados para esta fase.</div>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredResults.map(r => (
                <Card key={r.matchId} accent={editingResult?.matchId === r.matchId ? 'warning' : 'success'}>
                  {/* ─── Edit mode ─── */}
                  {editingResult?.matchId === r.matchId ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-[10px] text-pp-warning tracking-wider mb-1">EDITANDO RESULTADO</div>
                        <div className="text-sm font-bold">
                          {r.homeTeam} vs {r.awayTeam}
                        </div>
                        <div className="text-[10px] text-pp-text-muted">M{r.matchNumber}</div>
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-[10px] text-pp-text-muted mb-1">{r.homeTeam}</div>
                          <input type="number" min="0" max="20" value={editHome ?? ''}
                            onChange={e => { setEditHome(e.target.value === '' ? null : parseInt(e.target.value)); setShowConfirm(false); }}
                            className="w-14 h-14 text-center text-2xl font-black rounded-lg bg-pp-bg-surface border-2 border-pp-warning/50 text-pp-text focus:border-pp-gold focus:outline-none" />
                        </div>
                        <span className="text-pp-text-muted text-sm font-bold mt-5">–</span>
                        <div className="text-center">
                          <div className="text-[10px] text-pp-text-muted mb-1">{r.awayTeam}</div>
                          <input type="number" min="0" max="20" value={editAway ?? ''}
                            onChange={e => { setEditAway(e.target.value === '' ? null : parseInt(e.target.value)); setShowConfirm(false); }}
                            className="w-14 h-14 text-center text-2xl font-black rounded-lg bg-pp-bg-surface border-2 border-pp-warning/50 text-pp-text focus:border-pp-gold focus:outline-none" />
                        </div>
                      </div>
                      {editNeedsPenalties && (
                        <div className="bg-pp-warning-dim/20 border border-pp-warning/20 rounded-lg p-3 space-y-2">
                          <div className="text-[10px] text-pp-warning font-semibold text-center">Penales</div>
                          <div className="flex items-center justify-center gap-4">
                            <ScoreInput value={editHomePen} onChange={(v) => { setEditHomePen(v); setShowConfirm(false); }} />
                            <span className="text-pp-text-muted text-xs">–</span>
                            <ScoreInput value={editAwayPen} onChange={(v) => { setEditAwayPen(v); setShowConfirm(false); }} />
                          </div>
                        </div>
                      )}
                      {showConfirm && (
                        <div className="bg-pp-danger/10 border border-pp-danger/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-pp-danger font-semibold mb-1">
                            ¿Seguro que deseas editar este resultado?
                          </div>
                          <div className="text-[10px] text-pp-text-muted">
                            Esto recalculara los puntajes de todos los participantes.
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1" onClick={resetEdit}>Cancelar</Button>
                        <Button
                          variant={showConfirm ? 'danger' : 'primary'}
                          className="flex-[2]"
                          loading={saving}
                          disabled={editHome == null || editAway == null || (editNeedsPenalties && (editHomePen == null || editAwayPen == null))}
                          onClick={handleEditSave}
                        >
                          {showConfirm ? 'Confirmar edicion' : 'Guardar cambios'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ─── View mode ─── */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-[10px] font-mono text-pp-text-muted">M{r.matchNumber}</span>
                        <Badge variant="muted">
                          {PHASE_LABELS[r.phase] ?? r.phase}
                          {r.groupLetter ? ` ${r.groupLetter}` : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-right min-w-[40px]">{r.homeTeam}</span>
                        <div className="flex items-center gap-1 bg-pp-bg-surface px-2 py-1 rounded-md">
                          <span className="text-lg font-black text-pp-gold">{r.homeGoals}</span>
                          <span className="text-pp-text-muted text-xs">-</span>
                          <span className="text-lg font-black text-pp-gold">{r.awayGoals}</span>
                        </div>
                        <span className="text-sm font-semibold min-w-[40px]">{r.awayTeam}</span>
                        {r.homePenalties != null && (
                          <span className="text-[10px] text-pp-warning">
                            ({r.homePenalties}-{r.awayPenalties})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditClick(r)}
                        className="ml-3 px-2 py-1 text-[10px] font-semibold text-pp-warning border border-pp-warning/30 rounded-md hover:bg-pp-warning/10 transition-all"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          <Card>
            <div className="text-[10px] text-pp-text-muted uppercase tracking-wider mb-2">Resumen por fase</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(
                loadedResults.reduce((acc, r) => {
                  acc[r.phase] = (acc[r.phase] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([phase, count]) => (
                <div key={phase} className="bg-pp-bg-surface rounded-lg p-2 text-center">
                  <div className="text-[10px] text-pp-text-muted">{PHASE_LABELS[phase] ?? phase}</div>
                  <div className="text-lg font-black text-pp-success">{count}</div>
                </div>
              ))}
              <div className="bg-pp-bg-surface rounded-lg p-2 text-center">
                <div className="text-[10px] text-pp-text-muted">Total</div>
                <div className="text-lg font-black text-pp-gold">{loadedResults.length}/16</div>
              </div>
            </div>
          </Card>

          <Button variant="secondary" className="w-full" loading={rebuilding} onClick={handleRebuild}>
            Recalculo completo
          </Button>
        </div>
      )}
    </div>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}
