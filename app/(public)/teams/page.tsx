'use client';

import { useState } from 'react';
import { Card, PageHeader, GroupSelector } from '@/components/ui';

const TEAMS: Record<string, Array<{ name: string; flag: string; ranking: number; code: string }>> = {
  A: [
    { name: 'México', flag: '🇲🇽', ranking: 15, code: 'MEX' },
    { name: 'Sudáfrica', flag: '🇿🇦', ranking: 62, code: 'RSA' },
    { name: 'Rep. de Corea', flag: '🇰🇷', ranking: 25, code: 'KOR' },
    { name: 'Rep. Checa', flag: '🇨🇿', ranking: 38, code: 'CZE' },
  ],
  B: [
    { name: 'Canadá', flag: '🇨🇦', ranking: 39, code: 'CAN' },
    { name: 'Bosnia y Herzegovina', flag: '🇧🇦', ranking: 56, code: 'BIH' },
    { name: 'Catar', flag: '🇶🇦', ranking: 45, code: 'QAT' },
    { name: 'Suiza', flag: '🇨🇭', ranking: 17, code: 'SUI' },
  ],
  C: [
    { name: 'Brasil', flag: '🇧🇷', ranking: 5, code: 'BRA' },
    { name: 'Marruecos', flag: '🇲🇦', ranking: 13, code: 'MAR' },
    { name: 'Haití', flag: '🇭🇹', ranking: 90, code: 'HAI' },
    { name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', ranking: 48, code: 'SCO' },
  ],
};

export default function TeamsPage() {
  const [group, setGroup] = useState('A');
  const groups = 'ABCDEFGHIJKL'.split('');
  const teamList = TEAMS[group] || TEAMS.A;

  return (
    <div className="space-y-5">
      <PageHeader title="Equipos" subtitle="48 selecciones del Mundial FIFA 2026" />
      <GroupSelector groups={groups} selected={group} onSelect={setGroup} />

      <div className="text-xs font-bold text-pp-gold-light tracking-wider">GRUPO {group}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {teamList.map(t => (
          <Card key={t.code} className="flex items-center gap-4">
            <div className="text-4xl">{t.flag}</div>
            <div className="flex-1">
              <div className="text-sm font-bold">{t.name}</div>
              <div className="text-[10px] text-pp-text-muted">{t.code}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-pp-text-muted uppercase tracking-wider">FIFA</div>
              <div className="text-lg font-black text-pp-gold">#{t.ranking}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

