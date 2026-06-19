'use client';

import { useState } from 'react';
import { Card, Badge, PageHeader } from '@/components/ui';

// ═══════════════════════════════════════════════════════════
// Public Fixtures Page — all 104 matches
// ═══════════════════════════════════════════════════════════

const PHASES = ['Todos', 'Grupos', 'R32', 'R16', 'QF', 'SF', '3er', 'Final'];

const DEMO_FIXTURES = [
  { num: 1, home: 'México 🇲🇽', away: 'Sudáfrica 🇿🇦', date: 'Jun 11 · 19:00', venue: 'Estadio Azteca', phase: 'Grupos', result: '2-0' },
  { num: 2, home: 'Rep. Corea 🇰🇷', away: 'Rep. Checa 🇨🇿', date: 'Jun 12 · 02:00', venue: 'Estadio Akron', phase: 'Grupos', result: '1-1' },
  { num: 3, home: 'Canadá 🇨🇦', away: 'Bosnia 🇧🇦', date: 'Jun 12 · 19:00', venue: 'BMO Field', phase: 'Grupos', result: null },
  { num: 4, home: 'EE.UU. 🇺🇸', away: 'Paraguay 🇵🇾', date: 'Jun 13 · 01:00', venue: 'SoFi Stadium', phase: 'Grupos', result: null },
  { num: 73, home: '2A', away: '2B', date: 'Jun 28 · 19:00', venue: 'SoFi Stadium', phase: 'R32', result: null },
  { num: 104, home: 'W101', away: 'W102', date: 'Jul 19 · 20:00', venue: 'MetLife Stadium', phase: 'Final', result: null },
];

export default function FixturesPage() {
  const [filter, setFilter] = useState('Todos');

  const filtered = filter === 'Todos' ? DEMO_FIXTURES : DEMO_FIXTURES.filter(f => f.phase === filter);

  return (
    <div className="space-y-5">
      <PageHeader title="Fixture Completo" subtitle="Los 104 partidos del Mundial FIFA 2026" />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PHASES.map(p => (
          <button key={p} onClick={() => setFilter(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all
              ${filter === p ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                : 'bg-pp-bg-surface text-pp-text-muted border border-pp-border'}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(f => (
          <Card key={f.num} accent={f.result ? 'info' : 'none'}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-pp-text-muted">M{f.num}</span>
                  <Badge variant={f.result ? 'info' : 'muted'}>{f.phase}</Badge>
                </div>
                <div className="text-sm font-semibold mt-1">
                  {f.home} <span className="text-pp-text-muted mx-1">vs</span> {f.away}
                </div>
                <div className="text-[10px] text-pp-text-muted mt-0.5">{f.date} • {f.venue}</div>
              </div>
              {f.result && (
                <div className="text-xl font-black text-pp-gold">{f.result}</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

