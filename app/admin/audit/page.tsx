import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Admin Audit — Real audit log with filter
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { } from '@/lib/supabase/server';
import { getAuditLog } from '@/lib/data/queries';
import { prisma } from '@/lib/db/client';
import { Card, Badge, PageHeader } from '@/components/ui';

const POOL_ID = 'pool-propanas-2026';

export const dynamic = 'force-dynamic';

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'result_loaded', label: 'Resultados' },
  { value: 'config_changed', label: 'Config' },
  { value: 'override_created', label: 'Overrides' },
  { value: 'full_rebuild_triggered', label: 'Rebuilds' },
  { value: 'entry_locked', label: 'Locks' },
];

const ACTION_BADGE: Record<string, { variant: 'success' | 'info' | 'warning' | 'muted' | 'danger'; label: string }> = {
  result_loaded: { variant: 'success', label: 'Resultado' },
  config_changed: { variant: 'warning', label: 'Config' },
  override_created: { variant: 'danger', label: 'Override' },
  full_rebuild_triggered: { variant: 'info', label: 'Rebuild' },
  entry_locked: { variant: 'muted', label: 'Lock' },
  entry_submitted: { variant: 'success', label: 'Submit' },
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard');

  const params = await searchParams;
  const filter = params.filter ?? 'all';
  const logs = await getAuditLog(POOL_ID, filter, 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoría" subtitle="Historial completo de cambios críticos" />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map(f => (
          <Link
            key={f.value}
            href={f.value === 'all' ? '/admin/audit' : `/admin/audit?filter=${f.value}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all
              ${filter === f.value
                ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border'}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <Card className="text-center py-6">
            <div className="text-pp-text-muted text-sm">
              No hay entradas de auditoría
              {filter !== 'all' && ` para el filtro "${FILTER_OPTIONS.find(f => f.value === filter)?.label}"`}.
            </div>
          </Card>
        ) : (
          logs.map(log => {
            const badge = ACTION_BADGE[log.action] ?? { variant: 'muted' as const, label: log.action };
            return (
              <Card key={log.id} className="flex items-start gap-3">
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{log.summary}</div>
                  <div className="text-[10px] text-pp-text-muted mt-0.5">
                    {log.actorDisplayName} • {formatRelative(log.createdAt)} • {log.entityType}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatRelative(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return 'hace segundos';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}


