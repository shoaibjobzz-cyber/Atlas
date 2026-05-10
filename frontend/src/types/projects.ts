export type RecentProject = {
  id: string;
  name: string;
  owner: string;
  updatedAt: string;
  status: "Draft" | "In Review" | "Active";
  summary: string;
  locationOnDisk?: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  description: string | null;
  status: "Draft" | "In Review" | "Active" | "Archived";
  project_kind: "Standard" | "Platform";
  created_at: string;
  updated_at: string;
};
