import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import {
  compactTextButtonBaseSx,
  getCompactButtonToneSx,
  type CompactActionTone,
} from "./actionButtonStyles";

type AppCompactStatusControlProps = {
  children: ReactNode;
  startIcon?: ReactNode;
  tone?: CompactActionTone;
  sx?: SxProps<Theme>;
};

export default function AppCompactStatusControl({
  children,
  startIcon,
  tone = "neutral",
  sx,
}: AppCompactStatusControlProps) {
  const mergedSx = [
    compactTextButtonBaseSx,
    getCompactButtonToneSx(tone, "outlined"),
    {
      cursor: "default",
      userSelect: "none",
      pointerEvents: "none",
    },
  ];

  if (Array.isArray(sx)) {
    mergedSx.push(...sx);
  } else if (sx) {
    mergedSx.push(sx);
  }

  return (
    <Box component="span" sx={mergedSx as SxProps<Theme>}>
      {startIcon ? (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {startIcon}
        </Box>
      ) : null}
      <Box component="span">{children}</Box>
    </Box>
  );
}
