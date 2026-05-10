import type { RecentProject } from "../types/projects";

const WORKSPACE_ROOT = "C:\\Users\\shoai\\OneDrive\\Documents\\ATLAS\\requirements-intelligence-platform";

export const recentProjects: RecentProject[] = [
  {
    id: "braking-system",
    name: "Braking System Controls",
    owner: "Vehicle Dynamics Engineering",
    updatedAt: "Demo project",
    status: "In Review",
    summary: "Deterministic demo dataset with weak wording, conflicts, linked parameters, and timing feasibility evidence.",
    locationOnDisk: WORKSPACE_ROOT,
  },
  {
    id: "coffee-machine",
    name: "Coffee Machine Controls",
    owner: "Systems Engineering",
    updatedAt: "Updated 2 hours ago",
    status: "In Review",
    summary: "Safety, dispense control, and thermal management requirements baseline.",
    locationOnDisk: WORKSPACE_ROOT,
  },
  {
    id: "battery-pack",
    name: "Battery Pack Monitoring",
    owner: "Electrical Systems",
    updatedAt: "Updated yesterday",
    status: "Draft",
    summary: "Monitoring, protection logic, and sensor interface requirements.",
    locationOnDisk: WORKSPACE_ROOT,
  },
  {
    id: "flight-display",
    name: "Flight Display Interface",
    owner: "Avionics",
    updatedAt: "Updated 3 days ago",
    status: "Active",
    summary: "Pilot interaction, mode annunciation, and fault response requirements.",
    locationOnDisk: WORKSPACE_ROOT,
  },
];
