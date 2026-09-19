import { formatINR } from "../../lib/currency";

const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * Twelve-month bar strip (real data only). Booked bars with an optional
 * collected series; used by Overview and Finance → Year.
 */
export function MonthBars({ booked, collected, label }: { booked: number[]; collected?: number[]; label: string }) {
  const width = 340;
  const height = 120;
  const slot = width / 12;
  const series = collected ? 2 : 1;
  const barWidth = series === 2 ? 8 : 14;
  const gap = 3;
  const max = Math.max(1, ...booked, ...(collected ?? []));

  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height + 18}`} role="img" aria-label={label}>
      <line x1="0" y1={height} x2={width} y2={height} stroke="var(--line)" strokeWidth="1" />
      {booked.map((value, index) => {
        const collectedValue = collected?.[index] ?? 0;
        const totalWidth = series === 2 ? barWidth * 2 + gap : barWidth;
        const baseX = index * slot + (slot - totalWidth) / 2;
        const bookedHeight = Math.round((value / max) * (height - 8));
        const collectedHeight = Math.round((collectedValue / max) * (height - 8));
        return (
          <g key={index}>
            <rect x={baseX} y={height - bookedHeight} width={barWidth} height={bookedHeight} rx="2"
              fill="color-mix(in srgb, var(--accent) 88%, transparent)">
              <title>{`Booked ${MONTH_INITIALS[index]}: ${formatINR(value)}`}</title>
            </rect>
            {collected && (
              <rect x={baseX + barWidth + gap} y={height - collectedHeight} width={barWidth} height={collectedHeight} rx="2"
                fill="color-mix(in srgb, var(--accent) 24%, transparent)">
                <title>{`Collected ${MONTH_INITIALS[index]}: ${formatINR(collectedValue)}`}</title>
              </rect>
            )}
            <text x={index * slot + slot / 2} y={height + 13} textAnchor="middle" fontSize="8.5" fill="var(--text-3)">
              {MONTH_INITIALS[index]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
