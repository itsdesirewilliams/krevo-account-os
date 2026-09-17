import { genId } from "../../lib/id";
import { nowIso } from "../../lib/dates";
import type { Prospect, ProspectingData, Sprint } from "./prospecting.types";

/** Pure logic over prospecting data. No persistence, no React. */
export const prospectingRepository = {
  empty(): ProspectingData {
    return { sprints: [], prospects: [] };
  },

  normalize(input: unknown): ProspectingData {
    const d = (input && typeof input === "object" ? input : {}) as Partial<ProspectingData>;
    return {
      sprints: Array.isArray(d.sprints) ? d.sprints : [],
      prospects: Array.isArray(d.prospects) ? d.prospects : [],
    };
  },

  createSprint(data: ProspectingData, name: string, description: string): Sprint {
    const sprint: Sprint = { id: genId(), name: name.trim() || "Untitled Sprint", description: description.trim(), createdAt: nowIso() };
    data.sprints.push(sprint);
    return sprint;
  },

  renameSprint(data: ProspectingData, id: string, name: string): void {
    const s = data.sprints.find((x) => x.id === id);
    if (s && name.trim()) s.name = name.trim();
  },

  setSprintDescription(data: ProspectingData, id: string, description: string): void {
    const s = data.sprints.find((x) => x.id === id);
    if (s) s.description = description;
  },

  deleteSprint(data: ProspectingData, id: string): void {
    data.sprints = data.sprints.filter((s) => s.id !== id);
    data.prospects = data.prospects.filter((p) => p.sprintId !== id);
  },

  prospectsOf(data: ProspectingData, sprintId: string): Prospect[] {
    return data.prospects.filter((p) => p.sprintId === sprintId);
  },

  createProspect(
    data: ProspectingData,
    sprintId: string,
    companyName: string,
    website = "",
    notes = "",
  ): Prospect {
    const prospect: Prospect = {
      id: genId(),
      sprintId,
      companyName: companyName.trim(),
      website: website.trim(),
      notes: notes.trim(),
      status: "not-contacted",
      createdAt: nowIso(),
    };
    data.prospects.push(prospect);
    return prospect;
  },

  updateProspect(data: ProspectingData, id: string, patch: Partial<Omit<Prospect, "id" | "sprintId" | "createdAt">>): void {
    const p = data.prospects.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
  },

  deleteProspect(data: ProspectingData, id: string): void {
    data.prospects = data.prospects.filter((p) => p.id !== id);
  },
};
