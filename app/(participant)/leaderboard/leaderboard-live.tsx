// ═══════════════════════════════════════════════════════════
// LeaderboardLive — Client component with Supabase Realtime
// ═══════════════════════════════════════════════════════════

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { HeroCard, RankRow, PageHeader, Card, Badge } from '@/components/ui';
import { useRankingsLive } from '@/lib/hooks/use-rankings-live';
import type { LeaderboardData } from '@/lib/data/types';

interface Props {
  poolId: string;
  currentUserId: string;
  initialData: LeaderboardData;
}

export function LeaderboardLive({ poolId, initialData }: Props) {
  const { entries, lastUpdateAt, connected } = useRankingsLive(poolId, initialData.entries);

  const myEntry = entries.find(e => e.isCurrentUser);

  return (
    <div className="space-y-6">
      <PageHeader title="Ranking" subtitle="Tabla general actualizada en tiempo real" />

      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-pp-success animate-pulse-slow' : 'bg-pp-text-muted'}`}
            aria-hidden="true"
          />
          <span className="text-[10px] text-pp-text-muted tracking-wider uppercase">
            {connected ? 'En vivo' : 'Reconectando...'}
          </span>
          {lastUpdateAt && (
            <span className="text-[10px] text-pp-info ml-2">
              Actualizado {formatRelative(lastUpdateAt)}
            </span>
          )}
        </div>
        <span className="text-[10px] text-pp-text-muted">
          {initialData.total} {initialData.total === 1 ? 'participante' : 'participantes'}
        </span>
      </div>

      {/* My position hero */}
      <HeroCard
        position={myEntry?.position ?? initialData.myPosition}
        points={myEntry?.totalPoints ?? initialData.myPoints}
        completion={100}
      />

      {/* Ranking list */}
      {entries.length === 0 ? (
        <Card className="text-center py-8">
          <div className="text-pp-text-muted text-sm">
            Aún no hay puntuaciones. Carga resultados desde admin para activar el ranking.
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((r) => {
            const status = (r as any).entryStatus ?? 'DRAFT';
            const isApproved = status === 'APPROVED';

            return (
              <div key={r.userId}>
                {isApproved ? (
                  <Link href={`/breakdown/${r.entryId ?? r.userId}`} className="block">
                    <div className="flex items-center gap-2">
                      <StatusLed status={status} />
                      <div className="flex-1">
                        <RankRow
                          position={r.position}
                          name={r.displayName}
                          points={r.totalPoints}
                          isCurrentUser={r.isCurrentUser}
                        />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <StatusRow entry={r} status={status} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {initialData.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {initialData.page > 1 && (
            <Link href={`/leaderboard?page=${initialData.page - 1}`}
              className="px-3 py-1.5 text-xs bg-pp-bg-surface border border-pp-border rounded-md hover:border-pp-border-light">
              ← Anterior
            </Link>
          )}
          <span className="text-xs text-pp-text-muted">
            Página {initialData.page} de {initialData.pages}
          </span>
          {initialData.page < initialData.pages && (
            <Link href={`/leaderboard?page=${initialData.page + 1}`}
              className="px-3 py-1.5 text-xs bg-pp-bg-surface border border-pp-border rounded-md hover:border-pp-border-light">
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatusLed({ status }: { status: string }) {
  const color = status === 'APPROVED'
    ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
    : status === 'SUBMITTED'
      ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
      : 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]';

  return (
    <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${color}`} />
  );
}

function StatusRow({ entry, status }: { entry: any; status: string }) {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div>
      <div onClick={() => setShowMessage(!showMessage)} className="cursor-pointer">
        <div className="flex items-center gap-2">
          <StatusLed status={status} />
          <div className="flex-1">
            <RankRow
              position={entry.position}
              name={entry.displayName}
              points={entry.totalPoints}
              isCurrentUser={entry.isCurrentUser}
            />
          </div>
        </div>
      </div>
      {showMessage && (
        <div className="ml-5 mt-1 mb-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-sm font-semibold text-red-400">💰 Pago pendiente</div>
          <div className="text-xs text-pp-text-muted mt-1">
            {status === 'DRAFT'
              ? 'Esta quiniela aún no ha sido enviada.'
              : 'Esta quiniela fue enviada pero aún no ha sido aprobada por el administrador.'}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'hace segundos';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs}h`;
}
