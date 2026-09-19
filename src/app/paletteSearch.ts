/*
 * Command palette search: pure ranking. Kept free of React and domain logic so
 * the navigation brain is testable in isolation.
 */

export interface Candidate {
  id: string;
  group: "Navigate" | "Accounts" | "Projects" | "Preferences";
  /** Primary display + match target. */
  label: string;
  /** Right-aligned context (e.g. account name for a project). */
  hint?: string;
  /** Extra matchable text (aliases). */
  keywords?: string;
}

const normalize = (value: string): string => value.toLowerCase().trim();

/** Lower is better; null = no match. */
function score(label: string, keywords: string, query: string): number | null {
  if (!query) return 0;
  const lower = normalize(label);
  if (lower.startsWith(query)) return 0;
  if (lower.split(/\s+/).some((word) => word.startsWith(query))) return 1;
  if (lower.includes(query)) return 2;
  if (normalize(keywords).includes(query)) return 3;
  return null;
}

/** Stable ranking: prefix > word-prefix > substring > keyword; ties keep order. */
export function rankCandidates(candidates: Candidate[], query: string): Candidate[] {
  const q = normalize(query);
  const scored: { candidate: Candidate; index: number; score: number }[] = [];
  candidates.forEach((candidate, index) => {
    const value = score(candidate.label, candidate.keywords ?? "", q);
    if (value !== null) scored.push({ candidate, index, score: value });
  });
  scored.sort((a, b) => a.score - b.score || a.index - b.index);
  return scored.map((entry) => entry.candidate);
}

/** Split ranked results into their groups, preserving group order. */
export function groupCandidates(candidates: Candidate[]): { group: Candidate["group"]; items: Candidate[] }[] {
  const order: Candidate["group"][] = ["Navigate", "Accounts", "Projects", "Preferences"];
  return order
    .map((group) => ({ group, items: candidates.filter((c) => c.group === group) }))
    .filter((entry) => entry.items.length > 0);
}
