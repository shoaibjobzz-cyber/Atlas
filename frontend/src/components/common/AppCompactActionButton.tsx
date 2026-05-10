import { Button } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEventHandler, ReactNode } from "react";
import {
  compactTextButtonBaseSx,
  getCompactButtonToneSx,
  type CompactActionTone,
  type CompactActionVariant,
} from "./actionButtonStyles";

type AppCompactActionButtonProps = {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  tone?: CompactActionTone;
  variant?: CompactActionVariant;
  sx?: SxProps<Theme>;
};

export default function AppCompactActionButton({
  children,
  onClick,
  disabled = false,
  startIcon,
  endIcon,
  tone = "neutral",
  variant = "outlined",
  sx,
}: AppCompactActionButtonProps) {
  const mergedSx = [compactTextButtonBaseSx, getCompactButtonToneSx(tone, variant)];
  if (Array.isArray(sx)) {
    mergedSx.push(...sx);
  } else if (sx) {
    mergedSx.push(sx);
  }

  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      disableElevation
      sx={mergedSx as SxProps<Theme>}
    >
      {children}
    </Button>
  );
}
