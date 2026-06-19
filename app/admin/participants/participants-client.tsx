'use client';

import { useState } from 'react';
import { PageHeader, Card, Badge } from '@/components/ui';
import { DownloadPDFButton } from '@/components/download-pdf-button';

interface EntryRow {
  id: string;
  displayName: string;
  status: string;
  completionPct: number;
  champion: string | null;
  topScorer: string | null;
}

interface ParticipantRow {
  userId: string;
  displayName: string;
  email: string;
  entries: EntryRow[];
}

function StatusLed({ status }: { status: string }) {
  const color = status === 'APPROVED'
    ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
    : status === 'SUBMITTED'
      ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
      : 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]';
  return <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${color}`} />;
}

function StatusLabel({ status }: { status: string }) {
  if (status === 'APPROVED') return <Badge variant="success">Aprobada</Badge>;
  if (status === 'SUBMITTED') return <Badge variant="info">Enviada</Badge>;
  return <Badge variant="warning">Borrador</Badge>;
}

type FilterType = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | null;

export function ParticipantsClient({ participants }: { participants: ParticipantRow[] }) {
  const [filter, setFilter] = useState<FilterType>(null);

  const drafts = participants.reduce((s, p) => s + p.entries.filter(e => e.status === 'DRAFT').length, 0);
  const approved = participants.reduce((s, p) => s + p.entries.filter(e => e.status === 'APPROVED').length, 0);
  const submitted = participants.reduce((s, p) => s + p.entries.filter(e => e.status === 'SUBMITTED').length, 0);

  const handleFilter = (f: FilterType) => {
    setFilter(prev => prev === f ? null : f);
  };

  // Filter participants based on active filter
  const filtered = participants
    .map(p => ({
      ...p,
      entries: filter ? p.entries.filter(e => e.status === filter) : p.entries,
    }))
    .filter(p => p.entries.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participantes"
        subtitle={`${participants.length} jugadores · ${participants.reduce((s, p) => s + p.entries.length, 0)} quinielas`}
      />

      {/* Filter buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleFilter('DRAFT')}
          className={`rounded-xl p-4 text-left transition-all border-2 ${
            filter === 'DRAFT'
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-pp-border bg-pp-bg-card hover:border-yellow-500/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
            <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Borradores</div>
          </div>
          <div className="text-2xl font-black text-yellow-400">{drafts}</div>
        </button>

        <button
          onClick={() => handleFilter('SUBMITTED')}
          className={`rounded-xl p-4 text-left transition-all border-2 ${
            filter === 'SUBMITTED'
              ? 'border-red-500 bg-red-500/10'
              : 'border-pp-border bg-pp-bg-card hover:border-red-500/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Enviadas</div>
          </div>
          <div className="text-2xl font-black text-red-400">{submitted}</div>
        </button>

        <button
          onClick={() => handleFilter('APPROVED')}
          className={`rounded-xl p-4 text-left transition-all border-2 ${
            filter === 'APPROVED'
              ? 'border-green-500 bg-green-500/10'
              : 'border-pp-border bg-pp-bg-card hover:border-green-500/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
            <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Aprobadas</div>
          </div>
          <div className="text-2xl font-black text-green-400">{approved}</div>
        </button>
      </div>

      {filter && (
        <div className="text-xs text-pp-text-muted text-center">
          Mostrando solo quinielas en estado <strong className="text-pp-text">{filter}</strong> — presiona el botón de nuevo para ver todo
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <div className="text-pp-text-muted text-sm">No hay participantes con ese estado.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <Card key={p.userId}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold">{p.displayName}</div>
                  <div className="text-[10px] text-pp-text-muted">{p.email}</div>
                </div>
                <div className="text-[10px] text-pp-text-muted">
                  {p.entries.length} quiniela{p.entries.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="space-y-2">
                {p.entries.map(e => (
                  <div key={e.id}
                    className="bg-pp-bg-surface rounded-lg px-3 py-2.5 border border-pp-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <StatusLed status={e.status} />
                        <span className="text-sm font-semibold truncate">{e.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusLabel status={e.status} />
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-pp-text-muted">
                      <div>
                        <span className="text-pp-text-secondary font-semibold">Completitud</span>
                        <div className={`font-bold text-xs mt-0.5 ${e.completionPct === 100 ? 'text-pp-success' : 'text-pp-text'}`}>
                          {e.completionPct}%
                        </div>
                        <div className="w-full bg-pp-border rounded-full h-1 mt-1">
                          <div
                            className="h-1 rounded-full transition-all"
                            style={{
                              width: `${e.completionPct}%`,
                              background: e.completionPct === 100
                                ? '#22c55e'
                                : 'linear-gradient(90deg, #C9A84C, #6B1D2A)',
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-pp-text-secondary font-semibold">Campeón</span>
                        <div className="font-bold text-xs mt-0.5 text-pp-gold truncate">
                          {e.champion ?? '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-pp-text-secondary font-semibold">Goleador</span>
                        <div className="font-bold text-xs mt-0.5 truncate">
                          {e.topScorer ?? '—'}
                        </div>
                      </div>
                    </div>
                    {(e.completionPct === 100 || e.status === 'SUBMITTED' || e.status === 'APPROVED') && (
                      <div className="mt-2">
                        <DownloadPDFButton
                          entryId={e.id}
                          displayName={e.displayName}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}