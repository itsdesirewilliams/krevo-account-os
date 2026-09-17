export type ProspectStatus = "not-contacted" | "contacted" | "interested" | "not-interested";

export const PROSPECT_STATUSES: ProspectStatus[] = [
  "not-contacted",
  "contacted",
  "interested",
  "not-interested",
];

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  "not-contacted": "Not Contacted",
  contacted: "Contacted",
  interested: "Interested",
  "not-interested": "Not Interested",
};

export interface Sprint {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Prospect {
  id: string;
  sprintId: string;
  companyName: string;
  website: string;
  notes: string;
  status: ProspectStatus;
  createdAt: string;
}

export interface ProspectingData {
  sprints: Sprint[];
  prospects: Prospect[];
}
