/*
 * Team feature state: persists through the shared persistence helper and
 * exposes repo operations as actions. Members, jobs, SOPs and tasks all live
 * in this slice; Finance derives costs from it.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { usePersistentState } from "../../state/persist";
import {
  TEAM_KEY,
  addJob,
  addJobTask,
  addMember,
  defaultTeamData,
  deleteJob,
  deleteJobTask,
  deleteMember,
  normalizeTeamData,
  setJobSop,
  setJobTaskText,
  toggleJobTask,
  updateJob,
  updateMember,
} from "./team.repository";
import type { Job, JobTask, MemberType, SopRef, TeamData, TeamMember } from "./team.types";

interface TeamStore {
  data: TeamData;
  members: TeamMember[];
  /** True while the "+ Add Team Member" form is open (sidebar + view share it). */
  memberFormOpen: boolean;
  openMemberForm: () => void;
  closeMemberForm: () => void;
  memberById: (id: string | null) => TeamMember | undefined;
  createMember: (input: { type: MemberType; name: string; description: string; monthlyCost: number }) => void;
  editMember: (
    memberId: string,
    patch: Partial<Pick<TeamMember, "name" | "description" | "monthlyCost" | "active" | "type">>,
  ) => void;
  removeMember: (memberId: string) => void;
  createJob: (memberId: string, input: { name: string; description: string; category: string; active: boolean }) => void;
  editJob: (memberId: string, jobId: string, patch: Partial<Pick<Job, "name" | "description" | "category" | "active">>) => void;
  removeJob: (memberId: string, jobId: string) => void;
  attachSop: (memberId: string, jobId: string, sop: SopRef | null) => void;
  createTask: (memberId: string, jobId: string, text: string) => void;
  toggleTask: (memberId: string, jobId: string, taskId: string) => void;
  editTaskText: (memberId: string, jobId: string, taskId: string, text: string) => void;
  removeTask: (memberId: string, jobId: string, taskId: string) => void;
}

const TeamContext = createContext<TeamStore | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [data, setData] = usePersistentState<TeamData>(TEAM_KEY, defaultTeamData, normalizeTeamData);
  const [memberFormOpen, setMemberFormOpen] = useState(false);

  const value = useMemo<TeamStore>(
    () => ({
      data,
      members: data.members,
      memberFormOpen,
      openMemberForm: () => setMemberFormOpen(true),
      closeMemberForm: () => setMemberFormOpen(false),
      memberById: (id) => (id ? data.members.find((m) => m.id === id) : undefined),
      createMember: (input) => setData((d) => addMember(d, input)),
      editMember: (memberId, patch) => setData((d) => updateMember(d, memberId, patch)),
      removeMember: (memberId) => setData((d) => deleteMember(d, memberId)),
      createJob: (memberId, input) => setData((d) => addJob(d, memberId, input)),
      editJob: (memberId, jobId, patch) => setData((d) => updateJob(d, memberId, jobId, patch)),
      removeJob: (memberId, jobId) => setData((d) => deleteJob(d, memberId, jobId)),
      attachSop: (memberId, jobId, sop) => setData((d) => setJobSop(d, memberId, jobId, sop)),
      createTask: (memberId, jobId, text) => setData((d) => addJobTask(d, memberId, jobId, text)),
      toggleTask: (memberId, jobId, taskId) => setData((d) => toggleJobTask(d, memberId, jobId, taskId)),
      editTaskText: (memberId, jobId, taskId, text) => setData((d) => setJobTaskText(d, memberId, jobId, taskId, text)),
      removeTask: (memberId, jobId, taskId) => setData((d) => deleteJobTask(d, memberId, jobId, taskId)),
    }),
    [data, setData],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamStore {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used inside TeamProvider");
  return ctx;
}

export type { JobTask };
