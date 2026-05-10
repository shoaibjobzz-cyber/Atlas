import type { SxProps, Theme } from "@mui/material/styles";

export type CompactActionTone = "neutral" | "accent" | "danger";
export type CompactActionVariant = "outlined" | "contained" | "text";
export type StandardButtonHierarchy = "primary" | "secondary" | "tertiary" | "danger";

export const atlasSidebarPrimary = "#0f1b2d";
export const atlasSidebarPrimaryHover = "#162845";
export const atlasSidebarPrimarySoft = "rgba(15,27,45,0.06)";
export const atlasSidebarPrimaryBorder = "rgba(15,27,45,0.22)";
export const atlasMutedButtonText = "#475569";

export const compactActionRadius = 1.75;

export const compactIconButtonBaseSx: SxProps<Theme> = {
  width: 34,
  height: 34,
  minWidth: 34,
  minHeight: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  verticalAlign: "middle",
  border: `1px solid ${atlasSidebarPrimaryBorder}`,
  borderRadius: compactActionRadius,
  color: atlasSidebarPrimary,
  bgcolor: "rgba(255,255,255,0.96)",
  transition: "background-color 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease",
  "& .MuiSvgIcon-root": {
    fontSize: "1rem",
  },
  "&:hover": {
    bgcolor: atlasSidebarPrimarySoft,
    borderColor: "rgba(15,27,45,0.30)",
    color: atlasSidebarPrimary,
    boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
  },
};

export const compactTextButtonBaseSx: SxProps<Theme> = {
  minHeight: 34,
  height: 34,
  minWidth: 34,
  px: 1.125,
  borderRadius: compactActionRadius,
  fontSize: "0.8125rem",
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: "-0.01em",
  textTransform: "none",
  boxShadow: "none",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.625,
  verticalAlign: "middle",
  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
    margin: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    "& .MuiSvgIcon-root": {
      fontSize: "1rem",
    },
  },
  "& .MuiButton-startIcon": {
    marginRight: 0,
  },
  "& .MuiButton-endIcon": {
    marginLeft: 0,
  },
};

export const standardButtonBaseSx: SxProps<Theme> = {
  minHeight: 40,
  height: 40,
  px: 1.75,
  borderRadius: compactActionRadius,
  fontSize: "0.875rem",
  fontWeight: 600,
  lineHeight: 1,
  textTransform: "none",
  boxShadow: "none",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  verticalAlign: "middle",
  gap: 0.5,
  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
    margin: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    lineHeight: 0,
    transform: "translateY(-0.5px)",
    "& .MuiSvgIcon-root": {
      fontSize: "1rem",
      display: "block",
    },
  },
  "& .MuiButton-startIcon": {
    marginRight: 0,
  },
  "& .MuiButton-endIcon": {
    marginLeft: 0,
  },
  "& .MuiButton-label, & .MuiButtonBase-root": {
    alignItems: "center",
  },
};

export function getCompactButtonToneSx(
  tone: CompactActionTone = "neutral",
  variant: CompactActionVariant = "outlined"
): SxProps<Theme> {
  if (tone === "danger") {
    if (variant === "contained") {
      return {
        bgcolor: "#dc2626",
        color: "#ffffff",
        "&:hover": {
          bgcolor: "#b91c1c",
          boxShadow: "0 8px 18px rgba(127,29,29,0.16)",
        },
      };
    }

    if (variant === "text") {
      return {
        color: "#b91c1c",
        "&:hover": {
          bgcolor: "rgba(254,242,242,0.9)",
        },
      };
    }

    return {
      borderColor: "rgba(239,68,68,0.22)",
      color: "#b91c1c",
      "&:hover": {
        bgcolor: "rgba(254,242,242,0.9)",
        borderColor: "rgba(239,68,68,0.34)",
        color: "#991b1b",
        boxShadow: "0 6px 16px rgba(127,29,29,0.08)",
      },
    };
  }

  if (tone === "accent") {
    if (variant === "contained") {
      return {
        bgcolor: atlasSidebarPrimary,
        color: "#ffffff",
        "&:hover": {
          bgcolor: atlasSidebarPrimaryHover,
          boxShadow: "0 8px 18px rgba(15,27,45,0.16)",
        },
      };
    }

    if (variant === "text") {
      return {
        color: atlasMutedButtonText,
        "&:hover": {
          bgcolor: "rgba(241,245,249,0.92)",
        },
      };
    }

    return {
      borderColor: atlasSidebarPrimaryBorder,
      color: atlasSidebarPrimary,
      "&:hover": {
        bgcolor: atlasSidebarPrimarySoft,
        borderColor: "rgba(15,27,45,0.32)",
        color: atlasSidebarPrimary,
        boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
      },
    };
  }

  if (variant === "contained") {
    return {
      bgcolor: atlasSidebarPrimary,
      color: "#ffffff",
      "&:hover": {
        bgcolor: atlasSidebarPrimaryHover,
        boxShadow: "0 8px 18px rgba(15,27,45,0.16)",
      },
    };
  }

  if (variant === "text") {
    return {
      color: atlasMutedButtonText,
      "&:hover": {
        bgcolor: "rgba(241,245,249,0.92)",
      },
    };
  }

  return {
    borderColor: atlasSidebarPrimaryBorder,
    color: atlasSidebarPrimary,
    "&:hover": {
      bgcolor: atlasSidebarPrimarySoft,
      borderColor: "rgba(15,27,45,0.32)",
      color: atlasSidebarPrimary,
      boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
    },
  };
}

export function getStandardButtonHierarchySx(
  hierarchy: StandardButtonHierarchy = "secondary"
): SxProps<Theme> {
  if (hierarchy === "danger") {
    return {
      bgcolor: "#dc2626",
      color: "#ffffff",
      "&:hover": {
        bgcolor: "#b91c1c",
        boxShadow: "0 10px 22px rgba(127,29,29,0.16)",
      },
    };
  }

  if (hierarchy === "primary") {
    return {
      bgcolor: atlasSidebarPrimary,
      color: "#ffffff",
      "&:hover": {
        bgcolor: atlasSidebarPrimaryHover,
        boxShadow: "0 10px 22px rgba(15,27,45,0.16)",
      },
    };
  }

  if (hierarchy === "tertiary") {
    return {
      color: atlasMutedButtonText,
      borderColor: "transparent",
      bgcolor: "transparent",
      "&:hover": {
        bgcolor: "rgba(241,245,249,0.92)",
      },
    };
  }

  return {
    color: atlasSidebarPrimary,
    borderColor: atlasSidebarPrimaryBorder,
    bgcolor: "transparent",
    "&:hover": {
      bgcolor: atlasSidebarPrimarySoft,
      borderColor: "rgba(15,27,45,0.32)",
      boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
    },
  };
}
