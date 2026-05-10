import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type WorkspacePageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  titleVariant?: "h4" | "h5";
};

export default function WorkspacePageHeader({
  title,
  subtitle,
  actions,
  titleVariant = "h5",
}: WorkspacePageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ lg: "center" }}
      sx={{
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 2.25 },
        pb: { xs: 1.5, md: 1.75 },
        borderBottom: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <Box sx={{ minWidth: 0, pr: { lg: 2 } }}>
        <Typography
          variant={titleVariant}
          fontWeight={700}
          color="#0f172a"
          sx={{ letterSpacing: "-0.015em", lineHeight: 1.1 }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            variant={titleVariant === "h4" ? "body1" : "body2"}
            color="text.secondary"
            sx={{ mt: 0.7, maxWidth: 920, lineHeight: 1.45 }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
          justifyContent={{ xs: "flex-start", lg: "flex-end" }}
          sx={{ flexShrink: 0 }}
        >
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
