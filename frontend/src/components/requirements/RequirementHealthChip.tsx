import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { Chip } from "@mui/material";
import AppCompactStatusControl from "../common/AppCompactStatusControl";
import type { Requirement } from "../../types/requirements";

type RequirementHealthChipProps = {
  requirement: Pick<Requirement, "status" | "priority">;
  size?: "small" | "medium";
  appearance?: "chip" | "compact";
};

function getHealth(requirement: Pick<Requirement, "status" | "priority">) {
  if (requirement.status === "Rejected") {
    return {
      label: "Blocked",
      color: "error" as const,
      icon: <ReportProblemOutlinedIcon />,
    };
  }

  if (requirement.status === "Draft" || requirement.status === "In Review") {
    return {
      label: requirement.priority === "Critical" ? "Needs Attention" : "Under Review",
      color: requirement.priority === "Critical" ? "warning" as const : "default" as const,
      icon: <FavoriteBorderOutlinedIcon />,
    };
  }

  return {
    label: "Healthy",
    color: "success" as const,
    icon: <VerifiedOutlinedIcon />,
  };
}

export default function RequirementHealthChip({
  requirement,
  size = "small",
  appearance = "chip",
}: RequirementHealthChipProps) {
  const health = getHealth(requirement);

  if (appearance === "compact") {
    return (
      <AppCompactStatusControl
        tone={
          health.color === "error" ? "danger" : health.color === "success" ? "accent" : "neutral"
        }
        startIcon={health.icon}
      >
        {health.label}
      </AppCompactStatusControl>
    );
  }

  return (
    <Chip
      size={size}
      color={health.color}
      label={health.label}
      icon={health.icon}
      variant={health.color === "default" ? "outlined" : "filled"}
    />
  );
}
