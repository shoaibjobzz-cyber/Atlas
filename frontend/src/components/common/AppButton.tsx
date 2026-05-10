import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import {
  getStandardButtonHierarchySx,
  standardButtonBaseSx,
  type StandardButtonHierarchy,
} from "./actionButtonStyles";

type AppButtonProps = {
  children: ReactNode;
  hierarchy?: StandardButtonHierarchy;
  sx?: SxProps<Theme>;
} & Omit<ButtonProps, "variant" | "color" | "size">;

export default function AppButton({
  children,
  hierarchy = "secondary",
  sx,
  ...props
}: AppButtonProps) {
  const variant =
    hierarchy === "primary" || hierarchy === "danger"
      ? "contained"
      : hierarchy === "secondary"
        ? "outlined"
        : "text";

  const mergedSx = [];
  if (Array.isArray(sx)) {
    mergedSx.push(...sx);
  } else if (sx) {
    mergedSx.push(sx);
  }
  mergedSx.push(standardButtonBaseSx, getStandardButtonHierarchySx(hierarchy));

  return (
    <Button
      {...props}
      variant={variant}
      disableElevation
      sx={mergedSx as SxProps<Theme>}
    >
      {children}
    </Button>
  );
}
