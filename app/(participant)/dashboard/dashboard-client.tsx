'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@/components/ui';
import { translateError } from '@/lib/api/client';

// ─── Top Scorer Card ─────────────────────────────────────

interface TopScorerProps {
  entryId: string;
  playerName: string;
  goals: number;
  entryLocked: boolean;
}

export function TopScorerCard({ entryId, playerName: initialName, goals: initialGoals, entryLocked }: TopScorerProps) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState(initialName);
  const [goals, setGoals] = useState(initialGoals);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanged = playerName !== initialName || goals !== initialGoals;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/predictions/scorer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, playerName, goals: Number(goals) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">⚽ GOLEADOR DEL TORNEO</div>
      {error && (
        <div className="text-xs text-pp-danger mb-3 bg-pp-danger/10 p-2 rounded">{error}</div>
      )}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-pp-text-secondary font-semibold uppercase tracking-wider">
            Nombre del jugador
          </label>
          <input
            type="text" value={playerName}
            onChange={e => { setPlayerName(e.target.value); setSaved(false); }}
            className="w-full mt-1 px-3 py-2.5 bg-pp-bg-surface border border-pp-border rounded-lg text-sm
              text-pp-text focus:border-pp-gold focus:outline-none disabled:opacity-50"
            disabled={entryLocked}
            placeholder="Ej: Mbappé"
          />
        </div>
        <div>
          <label className="text-[10px] text-pp-text-secondary font-semibold uppercase tracking-wider">
            Goles pronosticados
          </label>
          <input
            type="number" min="0" max="30" value={goals}
            onChange={e => { setGoals(parseInt(e.target.value) || 0); setSaved(false); }}
            className="w-full mt-1 px-3 py-2.5 bg-pp-bg-surface border border-pp-border rounded-lg text-sm
              text-pp-text focus:border-pp-gold focus:outline-none disabled:opacity-50"
            disabled={entryLocked}
          />
        </div>
        {!entryLocked && (
          <Button variant="secondary" className="w-full" loading={saving}
            disabled={!playerName.trim() || goals <= 0 || (!hasChanged && saved)}
            onClick={handleSave}>
            {saved ? '✓ Guardado' : 'Guardar goleador'}
          </Button>
        )}
        {saved && <div className="text-[10px] text-pp-success text-center">✓ Goleador guardado</div>}
      </div>
    </Card>
  );
}

// ─── Submit Entry Card ───────────────────────────────────

interface SubmitEntryProps {
  entryId: string;
  entryStatus: string;
  completionPct: number;
}

export function SubmitEntryCard({ entryId, entryStatus, completionPct }: SubmitEntryProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = completionPct >= 100;
  const isDraft = entryStatus === 'DRAFT';
  const isSubmitted = entryStatus === 'SUBMITTED';
  const isApproved = entryStatus === 'APPROVED';

  const handleSubmit = async () => {
    if (!confirm('¿Estás seguro que deseas enviar tu quiniela? Una vez enviada no podrás hacer cambios.')) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/entries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card accent={isApproved ? 'success' : isSubmitted ? 'info' : 'none'}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-pp-gold-light tracking-wider">ESTADO DE LA QUINIELA</div>
          {isDraft && <Badge variant="warning">Borrador</Badge>}
          {isSubmitted && <Badge variant="info">Enviada — Pendiente de aprobación</Badge>}
          {isApproved && <Badge variant="success">Aprobada ✓</Badge>}
        </div>

        {isDraft && !isComplete && (
          <div className="text-xs text-pp-text-muted">
            Completa tu quiniela al 100% para poder enviarla. Progreso actual: {completionPct}%
          </div>
        )}

        {isDraft && isComplete && (
          <div className="text-xs text-pp-success">
            ¡Tu quiniela está completa! Envíala para que sea revisada y aprobada.
          </div>
        )}

        {isSubmitted && (
          <div className="text-xs text-pp-text-muted">
            Tu quiniela ha sido enviada y está pendiente de aprobación por el administrador.
          </div>
        )}

        {isApproved && (
          <div className="text-xs text-pp-success">
            Tu quiniela ha sido aprobada y está participando oficialmente.
          </div>
        )}

        {error && (
          <div className="text-xs text-pp-danger bg-pp-danger/10 p-2 rounded">{error}</div>
        )}

        {isDraft && (
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all
              ${isComplete
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border cursor-not-allowed opacity-50'}`}
          >
            {submitting ? 'Enviando...' : isComplete ? '✓ Enviar Quiniela' : '🔒 Completa tu quiniela para enviar'}
          </button>
        )}
      </div>
    </Card>
  );
}