import { Paper, Typography } from "@mui/material";
import type { PropsWithChildren, ReactNode } from "react";

type DashboardWidgetProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
}>;

export default function DashboardWidget({ title, subtitle, action, children }: DashboardWidgetProps) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#ffffff" }}>
      <Typography variant="h6" fontWeight={700} color="#0f172a">
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
      {action}
      {children}
    </Paper>
  );
}

