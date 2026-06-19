'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { triggerRebuild, translateError } from '@/lib/api/client';

export function RebuildButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleRebuild = async () => {
    if (!confirm('¿Ejecutar recálculo completo? Recalcula scores de todos los participantes.')) return;
    setLoading(true);
    setLastResult(null);
    try {
      const result = await triggerRebuild();
      setLastResult(`✓ ${result.participantsScored} participantes en ${result.elapsedMs}ms`);
      router.refresh();
    } catch (err) {
      setLastResult(`✗ ${translateError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-right">
      <Button variant="secondary" size="sm" loading={loading} onClick={handleRebuild}>
        Ejecutar rebuild
      </Button>
      {lastResult && (
        <div className={`text-[10px] mt-1 ${lastResult.startsWith('✓') ? 'text-pp-success' : 'text-pp-danger'}`}>
          {lastResult}
        </div>
      )}
    </div>
  );
}
