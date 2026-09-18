import { useState } from "react";
import { formatDate, todayLocalIso } from "../../../lib/dates";
import { POST_TYPE_LABELS } from "../content.types";
import type { ContentPost } from "../content.types";

const pad = (n: number) => String(n).padStart(2, "0");

const POST_DOT: Record<ContentPost["type"], string> = {
  post: "#3f9bff",
  collab: "#c6a0ff",
  repost: "#56b3ff",
  story: "#f2c94c",
  flyer: "#50e3a4",
};

/** Month grid of posts for one social account. */
export function ContentCalendar({ posts }: { posts: ContentPost[] }) {
  const [monthIso, setMonthIso] = useState(() => todayLocalIso().slice(0, 7));

  const parts = monthIso.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month, 0).getDate();

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setMonthIso(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`);
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <button className="icon-btn" title="Previous month" onClick={() => shiftMonth(-1)}>&lsaquo;</button>
        <div className="text-[13.5px] font-semibold">
          {firstDay.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </div>
        <button className="icon-btn" title="Next month" onClick={() => shiftMonth(1)}>&rsaquo;</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[11px] text-dim mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />;
          const iso = `${year}-${pad(month)}-${pad(day)}`;
          const dayPosts = posts.filter((p) => p.date === iso);
          return (
            <div key={iso} className="min-h-[64px] rounded-md border hairline p-1">
              <div className="text-[10.5px] text-dim mb-0.5">{day}</div>
              <div className="flex flex-col gap-0.5">
                {dayPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-1 min-w-0" title={`${post.title} · ${formatDate(post.date)}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: POST_DOT[post.type] }} />
                    <span className="truncate text-[10.5px] text-text">{post.title || POST_TYPE_LABELS[post.type]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
