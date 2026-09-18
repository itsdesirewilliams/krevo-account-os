import type { ReactNode } from "react";

/** Centered empty-state used by feature modules. */
export function FeatureEmpty({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-dim">
      <div className="text-[14px]">{message}</div>
      {action}
    </div>
  );
}
