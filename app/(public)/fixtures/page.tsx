import { prisma } from '@/lib/db/client';
import { PageHeader, Card } from '@/components/ui';

const POOL_ID = 'pool-propanas-octavos-2026';

export const dynamic = 'force-dynamic';

export default async function FixturesPage() {
  const matches = await prisma.match.findMany({
    where: { poolId: POOL_ID, phase: { not: 'GROUP' } },
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
    },
    orderBy: { matchNumber: 'asc' },
  });

  const byPhase: Record<string, typeof matches> = {};
  for (const m of matches) {
    const key = m.phase;
    if (!byPhase[key]) byPhase[key] = [];
    byPhase[key].push(m);
  }

  const phaseLabel: Record<string, string> = {
    R16: 'Octavos de Final',
    QF: 'Cuartos de Final',
    SF: 'Semifinales',
    THIRD: 'Tercer Lugar',
    FINAL: 'Final',
  };

  const phaseOrder = ['R16', 'QF', 'SF', 'THIRD', 'FINAL'];

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <PageHeader title="Fixture" subtitle="Los 32 partidos de la fase eliminatoria" />

      {phaseOrder.map(phase => {
        const phaseMatches = byPhase[phase];
        if (!phaseMatches?.length) return null;
        return (
          <div key={phase}>
            <div className="text-xs font-bold text-pp-gold-light tracking-wider mb-3">
              {phaseLabel[phase] ?? phase}
            </div>
            <div className="space-y-2">
              {phaseMatches.map(m => (
                <Card key={m.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-bold">
                        {m.homeTeam?.name ?? m.homeOrigin ?? 'TBD'}
                        <span className="text-pp-text-muted mx-2">vs</span>
                        {m.awayTeam?.name ?? m.awayOrigin ?? 'TBD'}
                      </div>
                      <div className="text-[10px] text-pp-text-muted mt-0.5">
                        {formatDate(m.scheduledAt)} • {m.venue}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-pp-text-muted">M{m.matchNumber}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}