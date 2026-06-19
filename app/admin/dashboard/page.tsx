import { getSessionUser } from '@/lib/supabase/server';
// ═══════════════════════════════════════════════════════════
// Admin Dashboard — Real stats from queries
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { } from '@/lib/supabase/server';
import { getAdminDashboardData } from '@/lib/data/queries';
import { prisma } from '@/lib/db/client';
import { Card, Badge, PageHeader } from '@/components/ui';
import { RebuildButton } from './rebuild-button';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

 const membership = await prisma.poolMembership.findUnique({
  where: { poolId_userId: { poolId: POOL_ID, userId: user.id } },
  });
  if (membership?.role !== 'ADMIN') redirect('/dashboard?error=admin_required');

  const data = await getAdminDashboardData(POOL_ID);

  return (
    <div className="space-y-6">
      <PageHeader title="Panel de Administración" subtitle="Control del torneo y la quiniela" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Partidos jugados</div>
          <div className="text-2xl font-black text-pp-info mt-1">
            {data.matchesPlayed}/{data.totalMatches}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Pendientes</div>
          <div className="text-2xl font-black text-pp-warning mt-1">
            {data.totalMatches - data.matchesPlayed}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Participantes</div>
          <div className="text-2xl font-black text-pp-success mt-1">{data.participantCount}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Overrides</div>
          <div className={`text-2xl font-black mt-1 ${data.activeOverrides > 0 ? 'text-pp-warning' : 'text-pp-text-muted'}`}>
            {data.activeOverrides}
          </div>
        </Card>
      </div>

      {/* FIFA matrix health */}
      {!data.matrixComplete && (
        <Card accent="warning">
          <div className="text-xs text-pp-warning font-semibold mb-1">
            ⚠ FIFA Matrix incompleto
          </div>
          <div className="text-xs text-pp-text-muted">
            Faltan {data.matrixMissing.length} combinaciones: {data.matrixMissing.join(', ')}.
            Completar antes del cierre de la fase de grupos.
          </div>
        </Card>
      )}

      {/* Last recalc */}
      <Card accent="info">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold">Última actividad</div>
            <div className="text-[10px] text-pp-text-muted">
              {data.lastRecalcAt
                ? `Hace ${formatRelative(data.lastRecalcAt)}`
                : 'Sin actividad reciente'}
            </div>
          </div>
          <Badge variant="success">OK</Badge>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/admin/results">
          <Card className="hover:!bg-pp-bg-hover transition-colors">
            <div className="text-base mb-1">⚽</div>
            <div className="text-sm font-semibold">Cargar resultado</div>
            <div className="text-[10px] text-pp-text-muted">
              {data.totalMatches - data.matchesPlayed} partidos pendientes
            </div>
          </Card>
        </Link>
        <Link href="/admin/config">
          <Card className="hover:!bg-pp-bg-hover transition-colors">
            <div className="text-base mb-1">⚙️</div>
            <div className="text-sm font-semibold">Configuración</div>
            <div className="text-[10px] text-pp-text-muted">Scoring y reglas</div>
          </Card>
        </Link>
        <Link href="/admin/overrides">
          <Card className="hover:!bg-pp-bg-hover transition-colors">
            <div className="text-base mb-1">🔧</div>
            <div className="text-sm font-semibold">Overrides</div>
            <div className="text-[10px] text-pp-text-muted">
              {data.activeOverrides} activo{data.activeOverrides === 1 ? '' : 's'}
            </div>
          </Card>
        </Link>
        <Link href="/admin/audit">
          <Card className="hover:!bg-pp-bg-hover transition-colors">
            <div className="text-base mb-1">📜</div>
            <div className="text-sm font-semibold">Auditoría</div>
            <div className="text-[10px] text-pp-text-muted">Historial de cambios</div>
          </Card>
        </Link>
      </div>

      {/* Full rebuild */}
      <Card accent="warning">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold">Recálculo completo</div>
            <div className="text-[10px] text-pp-text-muted">
              Reconstruye todos los scores desde source of truth
            </div>
          </div>
          <RebuildButton />
        </div>
      </Card>
    </div>
  );
}

function formatRelative(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return 'segundos';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}


