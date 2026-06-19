// ═══════════════════════════════════════════════════════════
// OverridesForm — Group standing + best thirds overrides
// Wired to POST /api/admin/overrides (triggers full rebuild)
// ═══════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, PageHeader } from '@/components/ui';
import { createOverride, translateError } from '@/lib/api/client';

interface Team {
  id: string; name: string; shortName: string; groupLetter: string;
}

interface OverrideRow {
  id: string;
  type: 'GROUP_STANDING' | 'BEST_THIRDS';
  targetGroup: string | null;
  reason: string | null;
  createdAt: Date;
  createdByName: string;
}

interface Props {
  teams: Team[];
  activeOverrides: OverrideRow[];
  bestThirdsRanking: Array<{ groupLetter: string; points: number; qualifies: boolean }> | null;
}

export function OverridesForm({ teams, activeOverrides, bestThirdsRanking }: Props) {
  const router = useRouter();

  const [type, setType] = useState<'GROUP_STANDING' | 'BEST_THIRDS'>('GROUP_STANDING');
  const [group, setGroup] = useState('A');
  const [positions, setPositions] = useState<Array<string | null>>([null, null, null, null]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Best thirds state (reorderable)
  const [thirdsRanking, setThirdsRanking] = useState(
    bestThirdsRanking ?? []
  );

  const groupTeams = teams.filter(t => t.groupLetter === group);

  const resetForm = () => {
    setPositions([null, null, null, null]);
    setReason('');
    setError(null);
  };

  const handleGroupStandingSave = async () => {
    if (positions.some(p => p === null)) {
      setError('Debes seleccionar los 4 equipos en su orden final');
      return;
    }
    if (new Set(positions).size !== 4) {
      setError('No puede haber equipos duplicados en las posiciones');
      return;
    }

    setSaving(true);
    setError(null);
    setLastResult(null);
    try {
      const payload = positions.map((teamId, idx) => ({
        position: idx + 1,
        teamId,
      }));

      const result = await createOverride({
        type: 'GROUP_STANDING',
        targetGroup: group,
        payload,
        reason: reason.trim() || undefined,
      });

      setLastResult(`✓ Override aplicado al grupo ${group} — ${result.elapsedMs}ms`);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBestThirdsSave = async () => {
    if (thirdsRanking.length === 0) {
      setError('No hay ranking de terceros para modificar');
      return;
    }

    setSaving(true);
    setError(null);
    setLastResult(null);
    try {
      const result = await createOverride({
        type: 'BEST_THIRDS',
        payload: {
          ranking: thirdsRanking.map((r, idx) => ({
            groupLetter: r.groupLetter,
            points: r.points,
            qualifies: idx < 8,
          })),
        },
        reason: reason.trim() || undefined,
      });

      setLastResult(`✓ Best thirds override aplicado — ${result.elapsedMs}ms`);
      setReason('');
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSaving(false);
    }
  };

  const moveThird = (idx: number, dir: -1 | 1) => {
    const next = [...thirdsRanking];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setThirdsRanking(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Overrides Manuales" subtitle="Correcciones excepcionales de clasificación" />

      <Card accent="warning">
        <div className="text-xs text-pp-warning">
          ⚠ Usar solo cuando el desempate automático no pueda resolver la clasificación
          (fair play, ranking FIFA, o decisión oficial de FIFA). Toda override dispara un recálculo completo.
        </div>
      </Card>

      {lastResult && (
        <Card accent="success">
          <div className="text-xs text-pp-success">{lastResult}</div>
        </Card>
      )}

      {error && (
        <Card accent="danger">
          <div className="text-xs text-pp-danger">{error}</div>
        </Card>
      )}

      {/* Type selector */}
      <div className="flex gap-2">
        {(['GROUP_STANDING', 'BEST_THIRDS'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all
              ${type === t ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border'}`}>
            {t === 'GROUP_STANDING' ? 'Posiciones de grupo' : 'Mejores terceros'}
          </button>
        ))}
      </div>

      {/* Group standing form */}
      {type === 'GROUP_STANDING' && (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {'ABCDEFGHIJKL'.split('').map(g => (
              <button key={g} onClick={() => { setGroup(g); resetForm(); }}
                className={`w-9 h-9 rounded-md text-sm font-bold flex-shrink-0
                  ${group === g ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                    : 'bg-pp-bg-surface text-pp-text-secondary border border-pp-border'}`}>
                {g}
              </button>
            ))}
          </div>

          <Card>
            <div className="text-xs font-bold text-pp-gold-light mb-3">GRUPO {group} — POSICIONES FORZADAS</div>

            {groupTeams.length === 0 ? (
              <div className="text-xs text-pp-text-muted py-4 text-center">
                Sin equipos cargados para el grupo {group}
              </div>
            ) : (
              <>
                {[1, 2, 3, 4].map(pos => (
                  <div key={pos} className="flex items-center gap-3 py-2 border-b border-pp-border/10 last:border-0">
                    <span className={`w-6 text-center font-bold text-sm
                      ${pos <= 2 ? 'text-pp-success' : pos === 3 ? 'text-pp-warning' : 'text-pp-text-muted'}`}>
                      {pos}°
                    </span>
                    <select
                      className="flex-1 bg-pp-bg-surface border border-pp-border rounded-md px-3 py-2 text-sm text-pp-text"
                      value={positions[pos - 1] ?? ''}
                      onChange={e => {
                        const next = [...positions];
                        next[pos - 1] = e.target.value || null;
                        setPositions(next);
                      }}
                    >
                      <option value="">Seleccionar equipo...</option>
                      {groupTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="mt-3">
                  <label className="text-[10px] text-pp-text-secondary">Razón del override</label>
                  <textarea
                    className="w-full mt-1 px-3 py-2 bg-pp-bg-surface border border-pp-border rounded-lg text-xs
                      text-pp-text focus:border-pp-gold focus:outline-none"
                    rows={2}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ej: Desempate resuelto por ranking FIFA..."
                  />
                </div>

                <Button variant="danger" className="w-full mt-3" loading={saving}
                  onClick={handleGroupStandingSave}>
                  Aplicar override y recalcular
                </Button>
              </>
            )}
          </Card>
        </>
      )}

      {/* Best thirds form */}
      {type === 'BEST_THIRDS' && (
        <Card>
          <div className="text-xs font-bold text-pp-gold-light mb-3">RANKING DE MEJORES TERCEROS</div>
          {thirdsRanking.length === 0 ? (
            <div className="text-center py-8 text-pp-text-muted text-sm">
              No hay terceros calculados aún — espera a que los 12 grupos se completen.
            </div>
          ) : (
            <>
              <div className="text-xs text-pp-text-muted mb-3">
                Los primeros 8 clasifican a R32. Usa las flechas para reordenar.
              </div>
              <div className="space-y-1 mb-4">
                {thirdsRanking.map((r, idx) => (
                  <div
                    key={r.groupLetter}
                    className={`flex items-center gap-3 py-2 px-3 rounded-md
                      ${idx < 8 ? 'bg-pp-success-dim/20 border border-pp-success/20' : 'bg-pp-bg-surface'}`}
                  >
                    <span className={`w-6 text-center font-bold text-sm
                      ${idx < 8 ? 'text-pp-success' : 'text-pp-text-muted'}`}>
                      {idx + 1}°
                    </span>
                    <span className="text-sm font-semibold flex-1">Grupo {r.groupLetter}</span>
                    <span className="text-xs text-pp-text-muted">{r.points} pts</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveThird(idx, -1)}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded bg-pp-bg-card border border-pp-border
                          text-pp-text-secondary hover:border-pp-gold disabled:opacity-30"
                      >↑</button>
                      <button
                        onClick={() => moveThird(idx, 1)}
                        disabled={idx === thirdsRanking.length - 1}
                        className="w-7 h-7 rounded bg-pp-bg-card border border-pp-border
                          text-pp-text-secondary hover:border-pp-gold disabled:opacity-30"
                      >↓</button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] text-pp-text-secondary">Razón del override</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 bg-pp-bg-surface border border-pp-border rounded-lg text-xs
                    text-pp-text focus:border-pp-gold focus:outline-none"
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ej: FIFA fallo por fair play..."
                />
              </div>

              <Button variant="danger" className="w-full mt-3" loading={saving}
                onClick={handleBestThirdsSave}>
                Aplicar override y recalcular
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Active overrides list */}
      <div>
        <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">
          OVERRIDES ACTIVOS ({activeOverrides.length})
        </div>
        {activeOverrides.length === 0 ? (
          <div className="text-center py-6 text-pp-text-muted text-sm">
            No hay overrides activos
          </div>
        ) : (
          <div className="space-y-2">
            {activeOverrides.map(o => (
              <Card key={o.id} className="flex items-start gap-3">
                <Badge variant={o.type === 'GROUP_STANDING' ? 'warning' : 'danger'}>
                  {o.type === 'GROUP_STANDING' ? `Grupo ${o.targetGroup}` : 'Terceros'}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {o.type === 'GROUP_STANDING'
                      ? `Posiciones forzadas en grupo ${o.targetGroup}`
                      : 'Ranking de terceros forzado'}
                  </div>
                  {o.reason && (
                    <div className="text-[11px] text-pp-text-secondary mt-0.5 italic">"{o.reason}"</div>
                  )}
                  <div className="text-[10px] text-pp-text-muted mt-0.5">
                    {o.createdByName} • {formatRelative(o.createdAt)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelative(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'hace segundos';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

