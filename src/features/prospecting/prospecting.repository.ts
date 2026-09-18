/*
 * Prospecting repository: pure, immutable helpers over ProspectingData.
 * No React, no storage. Every function returns a new ProspectingData.
 */
import { genId } from "../../lib/id";
import { nowIso } from "../../lib/dates";
import {
  PROSPECT_STATUSES,
  type Prospect,
  type ProspectStatus,
  type ProspectingData,
  type Sprint,
} from "./prospecting.types";

export const PROSPECTING_KEY = "krevo_prospecting";

export function defaultProspectingData(): ProspectingData {
  return { sprints: [], prospects: [] };
}

const isStatus = (value: unknown): value is ProspectStatus =>
  PROSPECT_STATUSES.includes(value as ProspectStatus);

function normalizeSprint(raw: unknown): Sprint {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<Sprint>;
  return {
    id: s.id || genId(),
    name: s.name == null ? "Untitled Sprint" : s.name,
    description: s.description == null ? "" : s.description,
    createdAt: s.createdAt || nowIso(),
  };
}

function normalizeProspect(raw: unknown): Prospect {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<Prospect>;
  return {
    id: p.id || genId(),
    sprintId: p.sprintId || "",
    companyName: p.companyName == null ? "" : p.companyName,
    website: p.website == null ? "" : p.website,
    notes: p.notes == null ? "" : p.notes,
    status: isStatus(p.status) ? p.status : "not-contacted",
    createdAt: p.createdAt || nowIso(),
  };
}

/** Repairs any missing fields and drops prospects whose sprint is gone. */
export function normalizeProspectingData(raw: unknown): ProspectingData {
  const d = (raw && typeof raw === "object" ? raw : {}) as { sprints?: unknown; prospects?: unknown };
  const sprints = Array.isArray(d.sprints) ? d.sprints.map(normalizeSprint) : [];
  const sprintIds = new Set(sprints.map((s) => s.id));
  const prospects = Array.isArray(d.prospects)
    ? d.prospects.map(normalizeProspect).filter((p) => sprintIds.has(p.sprintId))
    : [];
  return { sprints, prospects };
}

export function createSprint(data: ProspectingData, name: string, description: string): ProspectingData {
  const sprint: Sprint = {
    id: genId(),
    name: name.trim() || "Untitled Sprint",
    description: description.trim(),
    createdAt: nowIso(),
  };
  return { ...data, sprints: [...data.sprints, sprint] };
}

export function renameSprint(data: ProspectingData, id: string, name: string): ProspectingData {
  const value = name.trim();
  if (!value) return data;
  return { ...data, sprints: data.sprints.map((s) => (s.id === id ? { ...s, name: value } : s)) };
}

export function setSprintDescription(data: ProspectingData, id: string, description: string): ProspectingData {
  return { ...data, sprints: data.sprints.map((s) => (s.id === id ? { ...s, description } : s)) };
}

export function deleteSprint(data: ProspectingData, id: string): ProspectingData {
  return {
    sprints: data.sprints.filter((s) => s.id !== id),
    prospects: data.prospects.filter((p) => p.sprintId !== id),
  };
}

export function createProspect(
  data: ProspectingData,
  sprintId: string,
  companyName: string,
  website = "",
  notes = "",
): ProspectingData {
  const prospect: Prospect = {
    id: genId(),
    sprintId,
    companyName: companyName.trim(),
    website: website.trim(),
    notes: notes.trim(),
    status: "not-contacted",
    createdAt: nowIso(),
  };
  return { ...data, prospects: [...data.prospects, prospect] };
}

export function updateProspect(
  data: ProspectingData,
  id: string,
  patch: Partial<Pick<Prospect, "companyName" | "website" | "notes" | "status">>,
): ProspectingData {
  return { ...data, prospects: data.prospects.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

export function deleteProspect(data: ProspectingData, id: string): ProspectingData {
  return { ...data, prospects: data.prospects.filter((p) => p.id !== id) };
}
