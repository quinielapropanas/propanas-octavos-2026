import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MatchPrediction {
  matchNumber: number;
  phase: string;
  groupLetter: string | null;
  slotId: string | null;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
}

interface PDFInput {
  displayName: string;
  predictions: MatchPrediction[];
  logoDataUrl?: string;
}

const PHASE_LABELS: Record<string, string> = {
  GROUP: 'Fase de Grupos',
  R32: 'Dieciseisavos de Final',
  R16: 'Octavos de Final',
  QF: 'Cuartos de Final',
  SF: 'Semifinales',
  THIRD: 'Tercer Lugar',
  FINAL: 'Final',
};

function formatTimestamp(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatFilename(displayName: string): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const safeName = displayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  return `Resumen_${safeName}_${day}${month}${year}_${hours}${mins}.pdf`;
}

export function generateQuinielaPDF(input: PDFInput) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // ─── Header with logo ───
  if (input.logoDataUrl) {
    try {
      doc.addImage(input.logoDataUrl, 'PNG', margin, y, 30, 30);
      // Title next to logo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PROPANAS 2026', margin + 35, y + 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Quiniela del Mundial FIFA 2026', margin + 35, y + 19);
      y += 35;
    } catch {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PROPANAS 2026', margin, y + 10);
      y += 18;
    }
  } else {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPANAS 2026', margin, y + 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Quiniela del Mundial FIFA 2026', margin, y + 17);
    y += 22;
  }

  // Divider line
  doc.setDrawColor(180, 150, 50);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Quiniela name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Quiniela: ${input.displayName}`, margin, y);
  y += 7;

  // Timestamp
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${formatTimestamp()}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // ─── Group predictions by phase ───
  const phases = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'];

  for (const phase of phases) {
    const phaseMatches = input.predictions.filter(p => p.phase === phase);
    if (phaseMatches.length === 0) continue;

    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    // Phase header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 29, 42);
    doc.text(PHASE_LABELS[phase] ?? phase, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 2;

    if (phase === 'GROUP') {
      // Group by group letter
      const groups = [...new Set(phaseMatches.map(m => m.groupLetter).filter(Boolean))].sort();

      for (const group of groups) {
        const groupMatches = phaseMatches.filter(m => m.groupLetter === group);

        if (y > 250) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(`Grupo ${group}`, margin, y + 5);
        doc.setTextColor(0, 0, 0);

        const tableData = groupMatches.map(m => {
          const score = m.homeGoals != null ? `${m.homeGoals} - ${m.awayGoals}` : 'Sin pronóstico';
          return [
            `M${m.matchNumber}`,
            m.homeTeam,
            score,
            m.awayTeam,
          ];
        });

        autoTable(doc, {
          startY: y + 7,
          margin: { left: margin, right: margin },
          head: [['#', 'Local', 'Resultado', 'Visitante']],
          body: tableData,
          styles: { fontSize: 8, cellPadding: 1.5 },
          headStyles: {
            fillColor: [107, 29, 42],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 55 },
            2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
            3: { cellWidth: 55 },
          },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          didDrawPage: () => {},
        });

        y = (doc as any).lastAutoTable.finalY + 5;
      }
    } else {
      // Knockout phases
      const tableData = phaseMatches.map(m => {
        let score = m.homeGoals != null ? `${m.homeGoals} - ${m.awayGoals}` : 'Sin pronóstico';
        if (m.homePenalties != null && m.awayPenalties != null) {
          score += ` (Pen: ${m.homePenalties}-${m.awayPenalties})`;
        }
        return [
          m.slotId ?? `M${m.matchNumber}`,
          m.homeTeam,
          score,
          m.awayTeam,
        ];
      });

      autoTable(doc, {
        startY: y + 2,
        margin: { left: margin, right: margin },
        head: [['Slot', 'Local', 'Resultado', 'Visitante']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: {
          fillColor: [107, 29, 42],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 50 },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ─── Footer on last page ───
  const totalPredictions = input.predictions.filter(p => p.homeGoals != null).length;
  if (y > 270) {
    doc.addPage();
    y = margin;
  }
  y += 5;
  doc.setDrawColor(180, 150, 50);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de pronósticos: ${totalPredictions}/104`, margin, y);
  doc.text('ProPanas 2026 — Quiniela del Mundial FIFA 2026', pageWidth - margin, y, { align: 'right' });

  // ─── Add page numbers ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // ─── Save ───
  const filename = formatFilename(input.displayName);
  doc.save(filename);
}

// Helper to load logo as data URL
export function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
