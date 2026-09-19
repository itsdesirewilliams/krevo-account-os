import { formatINR } from "../../lib/currency";

type Tone = "none" | "auto" | "pos" | "neg";
type Size = "md" | "lg" | "xl";

/**
 * The single money renderer. Tabular numerals, a de-emphasised currency mark,
 * and a signed, toned variant for deltas. Never format money ad hoc.
 */
export function Money({
  value,
  size = "md",
  tone = "none",
  sign = false,
  className = "",
}: {
  value: number;
  size?: Size;
  tone?: Tone;
  /** Render a leading +/− (e.g. for deltas). */
  sign?: boolean;
  className?: string;
}) {
  const negative = value < 0;
  const digits = formatINR(Math.abs(value)).slice(1); // formatINR prefixes "₹"
  const sizeClass = size === "lg" ? "money-lg" : size === "xl" ? "money-xl" : "";
  const resolvedTone: Tone = tone === "auto" ? (negative ? "neg" : "pos") : tone;
  const toneClass = resolvedTone === "pos" ? "pos" : resolvedTone === "neg" ? "neg" : "";
  const lead = sign ? (negative ? "−" : "+") : negative ? "−" : "";

  return (
    <span className={["money", sizeClass, toneClass, className].filter(Boolean).join(" ")}>
      {lead}
      <span className="cur">₹</span>
      {digits}
    </span>
  );
}
