// ═══════════════════════════════════════════════════════════
// ConfigForm — Interactive scoring config with D3 exclusion validation
// ═══════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, PageHeader } from '@/components/ui';
import { updateConfig, translateError } from '@/lib/api/client';

interface ConceptRow {
  conceptId: number; name: string; points: number; isActive: boolean;
  description?: string | null;
}

const GROUP_OF = (id: number): 'match' | 'group' | 'advance' | 'global' => {
  if (id >= 15) return 'global';
  if (id >= 7 && id <= 13) return 'advance';
  if (id === 5 || id === 6) return 'group';
  return 'match';
};

const GROUP_LABELS: Record<string, string> = {
  match: 'CONCEPTOS DE PARTIDO',
  group: 'CONCEPTOS DE GRUPO',
  advance: 'CONCEPTOS DE AVANCE',
  global: 'CONCEPTOS GLOBALES',
};

export function ConfigForm({
  initialConcepts,
  initialFlags,
}: {
  initialConcepts: any[];
  initialFlags: any | null;
}) {
  const router = useRouter();
  const [concepts, setConcepts] = useState<ConceptRow[]>(initialConcepts.map(c => ({
    conceptId: c.conceptId, name: c.name, points: c.points,
    isActive: c.isActive, description: c.description,
  })));
  const [flags, setFlags] = useState({
    knockoutMatchScoringEnabled: initialFlags?.knockoutMatchScoringEnabled ?? false,
    penaltiesCountForScore: initialFlags?.penaltiesCountForScore ?? false,
    absoluteGoalDifference: initialFlags?.absoluteGoalDifference ?? true,
    goleadaThreshold: initialFlags?.goleadaThreshold ?? 4,
    showDraftInRanking: initialFlags?.showDraftInRanking ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // D3 exclusion validation
 // const c2 = concepts.find(c => c.conceptId === 2);
 // const c3 = concepts.find(c => c.conceptId === 3);
 // const c4 = concepts.find(c => c.conceptId === 4);
 // const exclusionError = c2?.isActive && (c3?.isActive || c4?.isActive);
 const exclusionError = false;
 
  const toggleConcept = (id: number) => {
    setConcepts(prev => prev.map(c => c.conceptId === id ? { ...c, isActive: !c.isActive } : c));
    setSaved(false);
  };

  const updatePoints = (id: number, pts: number) => {
    setConcepts(prev => prev.map(c => c.conceptId === id ? { ...c, points: pts } : c));
    setSaved(false);
  };

  const handleSave = async () => {
    if (exclusionError) {
      setError('Resuelve el conflicto de exclusión mutua antes de guardar');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Remove testDeadlineActive from flags (handled by separate API)
      const { testDeadlineActive, ...savableFlags } = flags as any;
      await updateConfig({
        concepts: concepts.map(c => ({
          conceptId: c.conceptId, name: c.name, points: c.points,
          isActive: c.isActive, description: c.description ?? undefined,
        })),
        flags: savableFlags,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSaving(false);
    }
  };

  const groupedConcepts = concepts.reduce((acc, c) => {
    const g = GROUP_OF(c.conceptId);
    (acc[g] ||= []).push(c);
    return acc;
  }, {} as Record<string, ConceptRow[]>);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración de Scoring" subtitle="Activa, desactiva y ajusta puntos por concepto" />

      {exclusionError && (
        <Card accent="danger">
          <div className="text-xs text-pp-danger font-semibold">
            ⚠ Exclusión mutua (D3): Concepto 2 (Marcador Acertado) no puede estar activo junto con 3 (Goles por Equipo) o 4 (Diferencia de Goles)
          </div>
        </Card>
      )}

      {error && (
        <Card accent="danger">
          <div className="text-xs text-pp-danger">{error}</div>
        </Card>
      )}

      {saved && (
        <Card accent="success">
          <div className="text-xs text-pp-success">✓ Configuración guardada</div>
        </Card>
      )}

      {Object.entries(GROUP_LABELS).map(([group, label]) => (
        groupedConcepts[group]?.length ? (
          <div key={group}>
            <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">{label}</div>
            <div className="space-y-2">
              {groupedConcepts[group].map(c => (
                <Card key={c.conceptId} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleConcept(c.conceptId)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all
                      ${c.isActive ? 'bg-pp-success-dim text-pp-success' : 'bg-pp-bg-surface text-pp-text-muted'}`}
                  >
                    {c.isActive ? '✓' : '–'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    {[2, 3, 4].includes(c.conceptId) && (
                      <div className="text-[9px] text-pp-warning">
                        Exclusión mutua con concepto {c.conceptId === 2 ? '3/4' : '2'}
                      </div>
                    )}
                  </div>
                  <input
                    type="number" min="0" max="100" value={c.points}
                    onChange={e => updatePoints(c.conceptId, parseInt(e.target.value) || 0)}
                    className="w-16 text-center py-1.5 bg-pp-bg-surface border border-pp-border rounded-md text-sm
                      font-bold text-pp-gold focus:border-pp-gold focus:outline-none"
                  />
                  <span className="text-[10px] text-pp-text-muted w-6">pts</span>
                </Card>
              ))}
            </div>
          </div>
        ) : null
      ))}

      {/* Behavior flags */}
      <div>
        <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">FLAGS DE COMPORTAMIENTO</div>
        <Card className="space-y-3">
          <FlagToggle label="Scoring de partidos knockout activo" hint="Si OFF, solo conceptos de grupo+avance puntúan"
            value={flags.knockoutMatchScoringEnabled}
            onChange={v => { setFlags(p => ({ ...p, knockoutMatchScoringEnabled: v })); setSaved(false); }} />
          <FlagToggle label="Contar penales en resultado" hint="Si ON, el marcador de penales suma al resultado base"
            value={flags.penaltiesCountForScore}
            onChange={v => { setFlags(p => ({ ...p, penaltiesCountForScore: v })); setSaved(false); }} />
          <FlagToggle label="Diferencia absoluta de goles" hint="Si OFF, signo importa (−2 vs +2 son distintos)"
            value={flags.absoluteGoalDifference}
            onChange={v => { setFlags(p => ({ ...p, absoluteGoalDifference: v })); setSaved(false); }} />

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">Umbral de goleada</div>
              <div className="text-[10px] text-pp-text-muted">Diferencia mínima para concepto 14</div>
            </div>
            <input type="number" min="2" max="10" value={flags.goleadaThreshold}
              onChange={e => { setFlags(p => ({ ...p, goleadaThreshold: parseInt(e.target.value) || 4 })); setSaved(false); }}
              className="w-16 text-center py-1.5 bg-pp-bg-surface border border-pp-border rounded-md text-sm font-bold" />
          </div>
		  <FlagToggle
            label="Mostrar borradores en ranking"
            hint="Si OFF, las quinielas en estado DRAFT no se muestran en el ranking de participantes"
            value={flags.showDraftInRanking}
            onChange={v => { setFlags(p => ({ ...p, showDraftInRanking: v })); setSaved(false); }}
          />
        </Card>
      </div>

     <Button variant="primary" className="w-full" size="lg"
        disabled={!!exclusionError} loading={saving} onClick={handleSave}>
        Guardar configuración
      </Button>

      <Card>
        <div className="space-y-3">
          <div className="text-xs font-bold text-red-400 tracking-wider">⚠️ ZONA PELIGROSA</div>
          <div className="text-[10px] text-pp-text-muted">
            Este botón borrará todos los resultados oficiales, rankings y bracket oficial (excepto R16 inicial).
          </div>
          <button
            onClick={async () => {
              if (!confirm('⚠️ ¿Estás seguro? Esto borrará TODOS los resultados oficiales, rankings y bracket propagado. Esta acción NO se puede deshacer.')) return;
              if (!confirm('Confirma una segunda vez. ¿Continuar con el reset?')) return;
              try {
                const res = await fetch('/api/admin/reset-results', { method: 'POST' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error');
                alert('✓ Resultados reseteados correctamente');
                window.location.reload();
              } catch (err: any) {
                alert('Error: ' + err.message);
              }
            }}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all
              bg-red-600 text-white hover:bg-red-700 shadow-lg"
          >
            🗑️ Reset Results
          </button>
        </div>
      </Card>
    </div>
  );
}

function FlagToggle({ label, hint, value, onChange }: {
  label: string; hint: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-pp-border/10 last:border-0">
      <div className="flex-1 pr-3">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[10px] text-pp-text-muted">{hint}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-all
          ${value ? 'bg-pp-success' : 'bg-pp-bg-surface border border-pp-border'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all
          ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
