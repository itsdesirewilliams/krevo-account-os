import { useStoreState } from "../../state/store";
import { useTeam } from "../team/teamState";
import { overviewOf } from "../../types";
import type { TaskLinks } from "./tasks.types";

/** Human-readable context ("Account · Project") for a task's links. */
export function useTaskContextLabel(): (links: TaskLinks) => string {
  const state = useStoreState();
  const { data: team } = useTeam();

  return (links) => {
    for (const account of state.accounts) {
      const overview = overviewOf(account);
      if (links.projectId && overview) {
        const project = overview.projects.find((p) => p.id === links.projectId);
        if (project) return `${account.name} · ${project.projectName || project.eventName || "Untitled"}`;
      }
      if (links.sheetId) {
        const sheet = account.sheets.find((s) => s.id === links.sheetId);
        if (sheet) return `${account.name} · ${sheet.name}`;
      }
    }
    if (links.jobId) {
      for (const member of team.members) {
        const job = member.jobs.find((j) => j.id === links.jobId);
        if (job) return `${member.name} · ${job.name || "Untitled Job"}`;
      }
    }
    return "";
  };
}
