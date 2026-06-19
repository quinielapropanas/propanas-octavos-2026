'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Button } from '@/components/ui';

interface Team {
  id: string;
  name: string;
  shortName: string;
}

interface Slot {
  slotId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

const R16_SLOTS = ['R16-01', 'R16-02', 'R16-03', 'R16-04', 'R16-05', 'R16-06', 'R16-07', 'R16-08'];

export function SetupR16Client({ teams, existingSlots }: { teams: Team[]; existingSlots: Slot[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initial: Record<string, { home: string; away: string }> = {};
  for (const slotId of R16_SLOTS) {
    const existing = existingSlots.find(s => s.slotId === slotId);
    initial[slotId] = {
      home: existing?.homeTeamId ?? '',
      away: existing?.awayTeamId ?? '',
    };
  }
  const [slots, setSlots] = useState(initial);

  const updateSlot = (slotId: string, field: 'home' | 'away', teamId: string) => {
    setSlots(prev => ({ ...prev, [slotId]: { ...prev[slotId], [field]: teamId } }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/setup-r16', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurar R16" subtitle="Asigna los 16 equipos clasificados a los 8 partidos de octavos" />

      {error && <Card accent="danger"><div className="text-xs text-pp-danger">{error}</div></Card>}
      {success && <Card accent="success"><div className="text-xs text-pp-success">✓ R16 configurado</div></Card>}

      <Card>
        <div className="space-y-3">
          {R16_SLOTS.map((slotId, i) => (
            <div key={slotId} className="bg-pp-bg-surface rounded-lg p-3 border border-pp-border/30">
              <div className="text-[10px] text-pp-gold-light font-bold mb-2">{slotId} (Partido {89 + i})</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={slots[slotId].home}
                  onChange={e => updateSlot(slotId, 'home', e.target.value)}
                  className="px-3 py-2 bg-pp-bg-card border border-pp-border rounded text-sm"
                >
                  <option value="">Local...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select
                  value={slots[slotId].away}
                  onChange={e => updateSlot(slotId, 'away', e.target.value)}
                  className="px-3 py-2 bg-pp-bg-card border border-pp-border rounded text-sm"
                >
                  <option value="">Visitante...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="primary" className="w-full" size="lg" loading={saving} onClick={handleSave}>
        Guardar R16
      </Button>
    </div>
  );
}