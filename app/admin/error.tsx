'use client';

import { useEffect } from 'react';
import { Button, Card } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin route error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card accent="danger" className="max-w-md w-full text-center space-y-3">
        <div className="text-3xl">⚠</div>
        <div className="text-base font-bold">Error en panel admin</div>
        <div className="text-xs text-pp-text-muted">
          {error.message || 'Error inesperado'}
        </div>
        {error.digest && (
          <div className="text-[10px] text-pp-text-muted font-mono">ref: {error.digest}</div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => (window.location.href = '/admin/dashboard')}>
            Dashboard admin
          </Button>
          <Button variant="primary" className="flex-1" onClick={reset}>
            Reintentar
          </Button>
        </div>
      </Card>
    </div>
  );
}

