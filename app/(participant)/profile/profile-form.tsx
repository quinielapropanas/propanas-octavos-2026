// ═══════════════════════════════════════════════════════════
// ProfileForm — Interactive profile management
// ═══════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/supabase/auth-context';
import { submitEntry, unsubmitEntry, translateError } from '@/lib/api/client';
import type { ProfileData } from '@/lib/data/types';

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const router = useRouter();
  const { signOut } = useAuth();

  
  const [savingEntry, setSavingEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const entryLocked = initialData.entryStatus === 'LOCKED';



  const handleSubmit = async () => {
    if (!confirm('¿Enviar tu quiniela? Podrás deshacer solo si no ha pasado el deadline.')) return;
    setError(null);
    setSavingEntry(true);
    try {
      await submitEntry();
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSavingEntry(false);
    }
  };

  const handleUnsubmit = async () => {
    if (!confirm('¿Volver a borrador? Tu quiniela vuelve a estar editable.')) return;
    setError(null);
    setSavingEntry(true);
    try {
      await unsubmitEntry();
      router.refresh();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSavingEntry(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Perfil" subtitle="Datos personales y pronósticos bonus" />

      {error && (
        <Card accent="danger">
          <div className="text-xs text-pp-danger">{error}</div>
        </Card>
      )}

      {/* Entry status card */}
      <Card accent={entryLocked ? 'none' : initialData.entryStatus === 'SUBMITTED' ? 'success' : 'warning'}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Estado de tu quiniela</div>
            <div className="text-xs text-pp-text-muted mt-0.5">
              {initialData.entryStatus === 'DRAFT' && `Borrador — ${initialData.completionPct}% completado`}
              {initialData.entryStatus === 'SUBMITTED' && `Enviada • Puedes deshacer si no pasó el deadline`}
              {initialData.entryStatus === 'LOCKED' && (
                initialData.entryLockedReason || 'Cerrada — no se permiten más cambios'
              )}
            </div>
          </div>
          <Badge variant={entryLocked ? 'muted' : initialData.entryStatus === 'SUBMITTED' ? 'success' : 'warning'}>
            {initialData.entryStatus === 'DRAFT' ? 'Borrador' :
             initialData.entryStatus === 'SUBMITTED' ? 'Enviada ✓' : 'Cerrada 🔒'}
          </Badge>
        </div>

        {initialData.canSubmit && (
          <Button variant="primary" className="w-full mt-4" loading={savingEntry} onClick={handleSubmit}>
            Enviar quiniela final
          </Button>
        )}
        {initialData.canUnsubmit && (
          <Button variant="secondary" className="w-full mt-4" loading={savingEntry} onClick={handleUnsubmit}>
            Volver a borrador
          </Button>
        )}
      </Card>

      {/* Personal data */}
      <Card>
        <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">DATOS PERSONALES</div>
        <div className="space-y-3">
          {[
            { label: 'Nombre', value: initialData.displayName },
            { label: 'Correo', value: initialData.email },
            { label: 'País', value: initialData.country ?? '—' },
            { label: 'Ciudad', value: initialData.city ?? '—' },
          ].map(f => (
            <div key={f.label} className="flex justify-between items-center py-2 border-b border-pp-border/10 last:border-0">
              <span className="text-xs text-pp-text-muted">{f.label}</span>
              <span className="text-sm font-medium">{f.value}</span>
            </div>
          ))}
        </div>
      </Card>



      {/* Logout */}
      <Card>
        <Button variant="ghost" className="w-full !text-pp-danger" onClick={signOut}>
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}

