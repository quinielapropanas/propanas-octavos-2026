'use client';

import { PageHeader, Card } from '@/components/ui';

// FIFA shortName → ISO 2-letter code for flag CDN
const ISO_MAP: Record<string, string> = {
  MEX: 'MX', RSA: 'ZA', KOR: 'KR', CZE: 'CZ',
  CAN: 'CA', BIH: 'BA', QAT: 'QA', SUI: 'CH',
  BRA: 'BR', MAR: 'MA', HAI: 'HT',
  USA: 'US', PAR: 'PY', AUS: 'AU', TUR: 'TR',
  GER: 'DE', CUW: 'CW', CIV: 'CI', ECU: 'EC',
  NED: 'NL', JPN: 'JP', SWE: 'SE', TUN: 'TN',
  BEL: 'BE', EGY: 'EG', IRN: 'IR', NZL: 'NZ',
  ESP: 'ES', CPV: 'CV', KSA: 'SA', URU: 'UY',
  FRA: 'FR', SEN: 'SN', IRQ: 'IQ', NOR: 'NO',
  ARG: 'AR', ALG: 'DZ', AUT: 'AT', JOR: 'JO',
  POR: 'PT', COD: 'CD', UZB: 'UZ', COL: 'CO',
  CRO: 'HR', GHA: 'GH', PAN: 'PA',
};

// Countries with local flag images (no standard ISO code for SVG CDN)
const LOCAL_FLAGS: Record<string, string> = {
  SCO: '/flags/gb-sct.png',
  ENG: '/flags/gb-eng.png',
};

function FlagImg({ shortName, size = 32 }: { shortName: string; size?: number }) {
  // Check local flags first
  const localFlag = LOCAL_FLAGS[shortName];
  if (localFlag) {
    return (
      <img
        src={localFlag}
        width={size}
        height={Math.round(size * 0.67)}
        alt={shortName}
        className="rounded-sm object-cover"
        style={{ minWidth: size }}
      />
    );
  }

  const iso = ISO_MAP[shortName];
  if (!iso) return <span style={{ fontSize: size }}>🏳️</span>;

  return (
    <img
      src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${iso}.svg`}
      width={size}
      height={Math.round(size * 0.67)}
      alt={shortName}
      className="rounded-sm object-cover"
      style={{ minWidth: size }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
        (e.target as HTMLImageElement).insertAdjacentHTML('afterend', '<span style="font-size:24px">🏳️</span>');
      }}
    />
  );
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  groupLetter: string;
  flagAssetKey: string | null;
}

interface Props {
  groups: Record<string, Team[]>;
}

export function EquiposClient({ groups }: Props) {
  const groupLetters = Object.keys(groups).sort();

  return (
    <div className="space-y-6">
      <PageHeader title="Equipos del Mundial" subtitle="Los 48 equipos participantes del Mundial FIFA 2026" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupLetters.map(letter => (
          <Card key={letter}>
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-pp-gold tracking-wider bg-pp-maroon/30 px-3 py-1 rounded-full">
                GRUPO {letter}
              </span>
            </div>
            <div className="space-y-2">
              {groups[letter].map(team => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-pp-bg-surface border border-pp-border/30"
                >
                  <FlagImg shortName={team.shortName} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{team.name}</div>
                  </div>
                  <span className="text-[10px] font-mono text-pp-text-muted bg-pp-bg-card px-2 py-0.5 rounded">
                    {team.shortName}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}