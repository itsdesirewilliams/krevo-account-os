/** A Person or Tool (recurring-cost entity) that performs work for Krevo. */
export type MemberType = "person" | "tool";

/** A task inside a Job. Jobs own tasks; team members do not hold tasks directly. */
export interface JobTask {
  id: string;
  jobId: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Metadata describing an attached SOP file. The actual bytes live separately
 * (browser: through the storage driver; desktop: app-data files/sops/<job-id>),
 * referenced by `fileKey`; large binaries never enter React/DOM state.
 */
export interface SopRef {
  id: string;
  jobId: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Storage key used to read/remove the binary through the storage driver. */
  fileKey: string;
  createdAt: string;
}

/** A unit of recurring work owned by exactly one team member. */
export interface Job {
  id: string;
  teamMemberId: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
  sop: SopRef | null;
  tasks: JobTask[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  type: MemberType;
  name: string;
  description: string;
  /** Recurring monthly cost in INR (fed into Finance). */
  monthlyCost: number;
  active: boolean;
  jobs: Job[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamData {
  members: TeamMember[];
}

export const MEMBER_TYPES: MemberType[] = ["person", "tool"];
