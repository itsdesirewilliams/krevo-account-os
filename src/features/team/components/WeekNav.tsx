import { addWeeks, formatDate, todayLocalIso, weekKey, weekRange } from "../../../lib/dates";

/** Prev/next/current ISO-week control shared by the weekly views. */
export function WeekNav({ weekIso, onChange }: { weekIso: string; onChange: (iso: string) => void }) {
  const range = weekRange(weekIso);
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <button className="icon-btn" title="Previous week" onClick={() => onChange(addWeeks(weekIso, -1))}>
        &lsaquo;
      </button>
      <div className="text-[14px] font-semibold">
        {weekKey(weekIso)} <span className="text-dim font-normal">· {formatDate(range.start)} – {formatDate(range.end)}</span>
      </div>
      <button className="icon-btn" title="Next week" onClick={() => onChange(addWeeks(weekIso, 1))}>
        &rsaquo;
      </button>
      <button className="btn btn-ghost" onClick={() => onChange(todayLocalIso())}>This week</button>
    </div>
  );
}
