/*
 * Team repository: pure data helpers over TeamData (no React, no storage).
 * All operations are immutable - they return a new TeamData.
 */
import { genId } from "../../lib/id";
import { nowIso } from "../../lib/dates";
import type { Job, MemberType, SopRef, TeamData, TeamMember } from "./team.types";

export const TEAM_KEY = "krevo_team_v1";

export function defaultTeamData(): TeamData {
  return { members: [] };
}

function normalizeSop(s: Partial<SopRef> | null | undefined, jobId: string): SopRef | null {
  if (!s || !s.fileName) return null;
  return {
    id: s.id || genId(),
    jobId: s.jobId || jobId,
    fileName: s.fileName,
    mimeType: s.mimeType || "text/plain",
    size: typeof s.size === "number" ? s.size : 0,
    fileKey: s.fileKey || "",
    createdAt: s.createdAt || nowIso(),
  };
}

function normalizeJob(j: Partial<Job>): Job {
  const now = nowIso();
  const id = j.id || genId();
  return {
    id,
    teamMemberId: j.teamMemberId || "",
    name: j.name == null ? "Untitled Job" : j.name,
    description: j.description == null ? "" : j.description,
    category: j.category == null ? "" : j.category,
    active: j.active !== false,
    sop: normalizeSop(j.sop, id),
    createdAt: j.createdAt || now,
    updatedAt: j.updatedAt || now,
  };
}

function normalizeMember(m: Partial<TeamMember>): TeamMember {
  const now = nowIso();
  const id = m.id || genId();
  return {
    id,
    type: m.type === "tool" ? "tool" : "person",
    name: m.name == null ? "Untitled" : m.name,
    description: m.description == null ? "" : m.description,
    monthlyCost: typeof m.monthlyCost === "number" && Number.isFinite(m.monthlyCost) ? m.monthlyCost : 0,
    active: m.active !== false,
    jobs: Array.isArray(m.jobs) ? m.jobs.map(normalizeJob) : [],
    createdAt: m.createdAt || now,
    updatedAt: m.updatedAt || now,
  };
}

/** Accepts legacy payloads (e.g. type "service") and repairs any missing fields. */
export function normalizeTeamData(raw: unknown): TeamData {
  if (!raw || typeof raw !== "object") return defaultTeamData();
  const r = raw as { members?: unknown };
  if (!Array.isArray(r.members)) return defaultTeamData();
  return {
    members: r.members.map((m) => {
      const rec = m as Partial<TeamMember> & { type?: string };
      const legacy = rec as { type?: string };
      if (legacy.type === "service") legacy.type = "tool";
      return normalizeMember(rec);
    }),
  };
}

const stamp = <T extends { updatedAt: string }>(x: T): T => ({ ...x, updatedAt: nowIso() });

/* ---------------- Members ---------------- */

export function addMember(
  data: TeamData,
  input: { type: MemberType; name: string; description: string; monthlyCost: number },
): TeamData {
  const now = nowIso();
  const member: TeamMember = {
    id: genId(),
    type: input.type,
    name: input.name.trim() || "Untitled",
    description: input.description.trim(),
    monthlyCost: input.monthlyCost,
    active: true,
    jobs: [],
    createdAt: now,
    updatedAt: now,
  };
  return { ...data, members: [...data.members, member] };
}

export function updateMember(
  data: TeamData,
  memberId: string,
  patch: Partial<Pick<TeamMember, "name" | "description" | "monthlyCost" | "active" | "type">>,
): TeamData {
  return {
    ...data,
    members: data.members.map((m) => (m.id === memberId ? stamp({ ...m, ...patch }) : m)),
  };
}

export function deleteMember(data: TeamData, memberId: string): TeamData {
  return { ...data, members: data.members.filter((m) => m.id !== memberId) };
}

/* ---------------- Jobs ---------------- */

export function addJob(
  data: TeamData,
  memberId: string,
  input: { name: string; description: string; category: string; active: boolean },
): TeamData {
  const now = nowIso();
  const job: Job = {
    id: genId(),
    teamMemberId: memberId,
    name: input.name.trim() || "Untitled Job",
    description: input.description.trim(),
    category: input.category.trim(),
    active: input.active,
    sop: null,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...data,
    members: data.members.map((m) => (m.id === memberId ? stamp({ ...m, jobs: [...m.jobs, job] }) : m)),
  };
}

export function updateJob(
  data: TeamData,
  memberId: string,
  jobId: string,
  patch: Partial<Pick<Job, "name" | "description" | "category" | "active">>,
): TeamData {
  return {
    ...data,
    members: data.members.map((m) =>
      m.id === memberId
        ? stamp({ ...m, jobs: m.jobs.map((j) => (j.id === jobId ? stamp({ ...j, ...patch }) : j)) })
        : m,
    ),
  };
}

export function deleteJob(data: TeamData, memberId: string, jobId: string): TeamData {
  return {
    ...data,
    members: data.members.map((m) =>
      m.id === memberId ? stamp({ ...m, jobs: m.jobs.filter((j) => j.id !== jobId) }) : m,
    ),
  };
}

/* ---------------- SOP ---------------- */

export function setJobSop(data: TeamData, memberId: string, jobId: string, sop: SopRef | null): TeamData {
  return {
    ...data,
    members: data.members.map((m) =>
      m.id === memberId
        ? stamp({ ...m, jobs: m.jobs.map((j) => (j.id === jobId ? stamp({ ...j, sop }) : j)) })
        : m,
    ),
  };
}

