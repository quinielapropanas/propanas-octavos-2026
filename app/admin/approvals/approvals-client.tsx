'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Badge, Button } from '@/components/ui';

interface EntryRow {
  id: string;
  displayName: string;
  userName: string;
  status: string;
  completionPct: number;
  entryNumber: number;
}

export function ApprovalsClient({ entries }: { entries: EntryRow[] }) {
  const router = useRouter();
  const [approving, setApproving] = useState<string | null>(null);

  const submitted = entries.filter(e => e.status === 'SUBMITTED');
  const approved = entries.filter(e => e.status === 'APPROVED');

  const handleApprove = async (entryId: string) => {
    if (!confirm('¿Aprobar esta quiniela? Esto confirma que el pago fue recibido.')) return;
    setApproving(entryId);
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Aprobaciones" subtitle="Gestiona las quinielas enviadas por los participantes" />

      {/* Pending approval */}
      <div>
        <div className="text-xs font-bold text-pp-warning tracking-wider mb-3">
          PENDIENTES DE APROBACIÓN ({submitted.length})
        </div>
        {submitted.length === 0 ? (
          <Card className="text-center py-6">
            <div className="text-pp-text-muted text-sm">No hay quinielas pendientes de aprobación.</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {submitted.map(e => (
              <Card key={e.id} accent="warning">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{e.displayName}</div>
                    <div className="text-[10px] text-pp-text-muted">{e.userName} • {e.completionPct}% completa</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Enviada</Badge>
                    <button
                      onClick={() => handleApprove(e.id)}
                      disabled={approving === e.id}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      {approving === e.id ? '...' : '✓ Aprobar'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Already approved */}
      <div>
        <div className="text-xs font-bold text-pp-success tracking-wider mb-3">
          APROBADAS ({approved.length})
        </div>
        {approved.length === 0 ? (
          <Card className="text-center py-6">
            <div className="text-pp-text-muted text-sm">No hay quinielas aprobadas aún.</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {approved.map(e => (
              <Card key={e.id} accent="success">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{e.displayName}</div>
                    <div className="text-[10px] text-pp-text-muted">{e.userName}</div>
                  </div>
                  <Badge variant="success">Aprobada ✓</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}