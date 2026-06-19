'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface Props {
  entryId: string;
  displayName: string;
}

export function DownloadPDFButton({ entryId, displayName }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Dynamically import to avoid SSR issues
      const { generateQuinielaPDF, loadImageAsDataUrl } = await import('@/lib/pdf/generate-quiniela-pdf');

      // Fetch predictions
      const res = await fetch(`/api/entries/predictions?entryId=${entryId}`);
      const data = await res.json();

      if (!data.predictions || data.predictions.length === 0) {
        alert('No hay pronósticos para descargar');
        return;
      }

      // Load logo
      let logoDataUrl: string | undefined;
      try {
        logoDataUrl = await loadImageAsDataUrl('/Logo_2026_small.png');
      } catch {
        // Logo optional
      }

      generateQuinielaPDF({
        displayName,
        predictions: data.predictions,
        logoDataUrl,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-bold transition-all
        bg-gradient-to-br from-pp-maroon to-pp-navy-deep text-pp-gold
        border border-pp-gold/30 hover:brightness-110 shadow-gold
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Generando PDF...' : '📄 Descargar Resumen Total'}
    </button>
  );
}
