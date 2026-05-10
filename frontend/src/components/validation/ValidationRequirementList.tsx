import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import AppCompactActionButton from "../common/AppCompactActionButton";
import { getRequirementTraceabilityPath, routePaths } from "../../routes/routePaths";
import type { ValidationRequirementResult } from "../../types/validation";
import { compareRequirementsByHierarchy } from "../../utils/requirementHierarchy";

type ValidationRequirementListProps = {
  title: string;
  description: string;
  emptyMessage: string;
  items: ValidationRequirementResult[];
  renderBody: (item: ValidationRequirementResult) => ReactNode;
};

export default function ValidationRequirementList({
  title,
  description,
  emptyMessage,
  items,
  renderBody,
}: ValidationRequirementListProps) {
  const navigate = useNavigate();
  const sortedItems = [...items].sort((left, right) =>
    compareRequirementsByHierarchy(left.requirement, right.requirement)
  );

  return (
    <Accordion
      defaultExpanded
      disableGutters
      sx={{
        border: "1px solid rgba(15,23,42,0.12)",
        borderRadius: 2,
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
        <Stack spacing={0.4}>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {sortedItems.length === 0 ? (
            <Paper elevation={0} sx={{ p: 2, border: "1px dashed rgba(15,23,42,0.18)", bgcolor: "#f8fafc" }}>
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Paper>
          ) : null}

          {sortedItems.map((item) => (
            <Paper key={item.requirement.id} elevation={0} sx={{ p: 2, border: "1px solid rgba(15,23,42,0.12)" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography fontWeight={700}>{item.requirement.requirement_code}</Typography>
                  <Chip size="small" label={item.requirement.type} variant="outlined" />
                  <Chip size="small" label={item.requirement.status} variant="outlined" />
                </Stack>
                <Typography fontWeight={600}>{item.requirement.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.requirement.text}
                </Typography>
                {renderBody(item)}
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <AppCompactActionButton
                    startIcon={<RuleOutlinedIcon />}
                    onClick={() =>
                      navigate(routePaths.projectRequirementDetail(item.requirement.project_id, item.requirement.id))
                    }
                  >
                    Open Detail
                  </AppCompactActionButton>
                  <AppCompactActionButton
                    endIcon={<LaunchOutlinedIcon />}
                    onClick={() =>
                      navigate(getRequirementTraceabilityPath(item.requirement.project_id, item.requirement.id))
                    }
                  >
                    Open Traceability
                  </AppCompactActionButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
