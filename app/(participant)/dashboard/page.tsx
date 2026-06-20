// ═══════════════════════════════════════════════════════════
// Dashboard — Server Component with real data
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/data/queries';
import { prisma } from '@/lib/db/client';
import { HeroCard, Card, Badge, PageHeader, Button } from '@/components/ui';
import { TopScorerCard, SubmitEntryCard } from './dashboard-client';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { entry?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let entryId = searchParams?.entry;
  if (!entryId) {
    const firstEntry = await prisma.entry.findFirst({
      where: { poolId: POOL_ID, userId: user.id },
      orderBy: { entryNumber: 'asc' },
      select: { id: true },
    });
    entryId = firstEntry?.id;
  }

  const data = await getDashboardData(user.id, POOL_ID, entryId);

  // Get top scorer for this entry
  let topScorer = { playerName: '', goals: 0 };
  if (entryId) {
    const ts = await prisma.topScorerPrediction.findFirst({
      where: { poolId: POOL_ID, entryId },
    });
    if (ts) {
      topScorer = { playerName: ts.playerName ?? '', goals: ts.goals ?? 0 };
    }
  }

  const countdownStr = data.nextDeadlineAt
    ? formatCountdown(data.nextDeadlineAt)
    : null;

  const entryParam = entryId ? `&entry=${entryId}` : '';
 
 // Scorer is locked only if: entry has a scorer already OR deadline passed
  // If entry is submitted/approved but has no scorer, allow editing
  const entryLocked = ['LOCKED', 'SUBMITTED', 'APPROVED'].includes(data.entryStatus);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Bienvenido de vuelta`} />

      <HeroCard
        position={data.position}
        points={data.totalPoints}
        completion={data.completionPct}
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Pronósticos</div>
          <div className="text-2xl font-black text-pp-text mt-1">
            {data.matchesPredicted}/{data.totalMatches}
          </div>
          <Badge variant={data.entryStatus === 'DRAFT' ? 'warning' : data.entryStatus === 'SUBMITTED' ? 'success' : 'muted'}>
            {data.entryStatus === 'DRAFT' ? 'Borrador' : data.entryStatus === 'SUBMITTED' ? 'Enviada ✓' : 'Cerrada 🔒'}
          </Badge>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">
            {countdownStr ? 'Próximo cierre' : 'Sin deadline activo'}
          </div>
          <div className="text-2xl font-black text-pp-danger mt-1">
            {countdownStr ?? '—'}
          </div>
          {data.nextMatch && (
            <Badge variant="danger">
              {data.nextMatch.phase === 'GROUP' ? 'Fase de grupos' : data.nextMatch.phase}
            </Badge>
          )}
        </Card>
      </div>

      {data.nextMatch && (
        <Card accent="info">
          <div className="text-[10px] text-pp-info tracking-wider mb-2">PRÓXIMO PARTIDO</div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-bold">
                {data.nextMatch.homeTeam?.name ?? data.nextMatch.homeOrigin ?? 'TBD'}
                <span className="text-pp-text-muted mx-2">vs</span>
                {data.nextMatch.awayTeam?.name ?? data.nextMatch.awayOrigin ?? 'TBD'}
              </div>
              <div className="text-[10px] text-pp-text-muted mt-0.5">
                {formatDate(data.nextMatch.scheduledAt)} • {data.nextMatch.venue}
              </div>
            </div>
            <span className="text-[10px] font-mono text-pp-text-muted">M{data.nextMatch.matchNumber}</span>
          </div>
        </Card>
      )}

      

	{/* Submit entry */}
      {entryId && (
        <SubmitEntryCard
          entryId={entryId}
          entryStatus={data.entryStatus}
          completionPct={data.completionPct}
        />
      )}
	  
      <div className="space-y-3">
        <Link href={`/groups?${entryId ? `entry=${entryId}` : ''}`} className="block">
          <Button variant="primary" className="w-full" size="lg">
            {data.matchesPredicted === 0 ? 'Empezar pronósticos' : 'Continuar pronósticos'} →
          </Button>
        </Link>
        <Link href="/leaderboard" className="block">
          <Button variant="secondary" className="w-full">
            Ver ranking
          </Button>
        </Link>
      </div>
    </div>
  );
}

function formatCountdown(deadline: Date): string {
  const now = Date.now();
  const diff = deadline.getTime() - now;
  if (diff < 0) return 'Cerrado';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days >= 1) return `${days}d ${hours}h`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m`;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}
