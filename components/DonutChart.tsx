'use client';

import { useEffect, useRef } from 'react';

interface DonutChartProps {
  entries: [string, number][];
  total: number;
  colorMap: Record<string, string>;
  canvasId: string;
  legendId: string;
  title: string;
}

function formatAmount(amount: number): string {
  return `${(Number(amount) || 0).toFixed(2)}`;
}

export default function DonutChart({ entries, total, colorMap, canvasId, legendId, title }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 200, H = 200;
    const cx = W / 2, cy = H / 2;
    const outerR = 85, innerR = 54;

    ctx.clearRect(0, 0, W, H);

    let startAngle = -Math.PI / 2;
    for (const [cat, amount] of entries) {
      const slice = (amount / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = colorMap[cat] ?? '#b2bec3';
      ctx.fill();
      startAngle += slice;
    }

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#0d0e12';
    ctx.font = 'bold 16px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatAmount(total), cx, cy - 8);
    ctx.font = '500 10px Space Grotesk, sans-serif';
    ctx.fillStyle = '#9195a8';
    ctx.fillText('total', cx, cy + 10);
  }, [entries, total, colorMap]);

  return (
    <div className="chart-card">
      <h2 className="chart-card-title">{title}</h2>
      <div className="chart-layout">
        <canvas ref={canvasRef} id={canvasId} width={200} height={200} />
        <div className="chart-legend" id={legendId}>
          {entries.map(([cat, amount]) => (
            <div className="legend-item" key={cat}>
              <div className="legend-dot" style={{ background: colorMap[cat] ?? '#b2bec3' }} />
              <span className="legend-label">{cat}</span>
              <span className="legend-amount">{formatAmount(amount)}</span>
              <span className="legend-pct">{((amount / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
