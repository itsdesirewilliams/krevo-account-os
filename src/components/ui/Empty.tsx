import type { ReactNode } from "react";
import { KnightIcon } from "../Icons";

/** Useful empty state: a restrained brand mark, one line of context, one action. */
export function Empty({
  title,
  sub,
  action,
  mark = true,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  mark?: boolean;
}) {
  return (
    <div className="empty">
      {mark && (
        <div className="empty-mark">
          <KnightIcon size={20} />
        </div>
      )}
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action}
    </div>
  );
}
