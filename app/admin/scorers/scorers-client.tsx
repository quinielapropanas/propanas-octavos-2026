'use client';

import { PageHeader, Card, Badge } from '@/components/ui';

interface ScorerRow {
  entryName: string;
  userName: string;
  entryStatus: string;
  playerName: string;
  goals: number;
}

export function ScorersClient({ predictions }: { predictions: ScorerRow[] }) {
  const withPrediction = predictions.filter(p => p.playerName !== '—');
  const without = predictions.length - withPrediction.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goleadores"
        subtitle={`${withPrediction.length} predicciones de goleador registradas`}
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Con predicción</div>
          <div className="text-2xl font-black text-pp-success mt-1">{withPrediction.length}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-pp-text-muted uppercase tracking-wider">Sin predicción</div>
          <div className="text-2xl font-black text-pp-text-muted mt-1">{without}</div>
        </Card>
      </div>

      {withPrediction.length === 0 ? (
        <Card className="text-center py-8">
          <div className="text-pp-text-muted text-sm">
            Ningún participante ha registrado su predicción de goleador.
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {withPrediction.map((p, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{p.entryName}</div>
                  <div className="text-[10px] text-pp-text-muted">{p.userName}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-sm font-bold text-pp-gold">{p.playerName}</div>
                  <div className="text-[10px] text-pp-text-muted">{p.goals} goles</div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <StatusLed status={p.entryStatus} />
                </div>
              </div>
            </Card>
          ))}
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

  return <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${color}`} />;
}