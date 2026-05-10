import { IconButton, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEventHandler, ReactNode } from "react";
import {
  compactIconButtonBaseSx,
  getCompactButtonToneSx,
  type CompactActionTone,
} from "./actionButtonStyles";

type AppIconActionButtonProps = {
  title: string;
  ariaLabel: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  tone?: CompactActionTone;
  tooltipOpen?: boolean;
  onTooltipClose?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  sx?: SxProps<Theme>;
};

export default function AppIconActionButton({
  title,
  ariaLabel,
  children,
  onClick,
  disabled = false,
  tone = "neutral",
  tooltipOpen,
  onTooltipClose,
  onMouseEnter,
  onFocus,
  sx,
}: AppIconActionButtonProps) {
  const mergedSx = [compactIconButtonBaseSx, getCompactButtonToneSx(tone, "outlined")];
  if (Array.isArray(sx)) {
    mergedSx.push(...sx);
  } else if (sx) {
    mergedSx.push(sx);
  }

  return (
    <Tooltip title={title} arrow open={tooltipOpen} onClose={onTooltipClose}>
      <span>
        <IconButton
          size="small"
          aria-label={ariaLabel}
          onClick={onClick}
          disabled={disabled}
          onMouseEnter={onMouseEnter}
          onFocus={onFocus}
          sx={mergedSx as SxProps<Theme>}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
