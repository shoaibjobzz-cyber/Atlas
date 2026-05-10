import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import { Box, Button, Divider, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Fragment, useMemo, useState } from "react";

export type WorkspaceCommandItem = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
};

export type WorkspaceCommandMenu = {
  key: string;
  label: string;
  items: WorkspaceCommandItem[];
};

type WorkspaceCommandBarProps = {
  primaryAction?: ReactNode;
  menus: WorkspaceCommandMenu[];
  statusContent?: ReactNode;
};

export default function WorkspaceCommandBar({
  primaryAction,
  menus,
  statusContent,
}: WorkspaceCommandBarProps) {
  const [anchorMap, setAnchorMap] = useState<Record<string, HTMLElement | null>>({});

  const activeMenus = useMemo(
    () => menus.filter((menu) => menu.items.some((item) => item.label.trim().length > 0)),
    [menus]
  );

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: 1,
        borderBottom: "1px solid rgba(15,23,42,0.08)",
        bgcolor: "#f6f8fb",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ lg: "center" }}
      >
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
          {primaryAction ? (
            <>
              {primaryAction}
              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: "none", sm: "block" }, borderColor: "rgba(15,23,42,0.08)" }}
              />
            </>
          ) : null}

          {activeMenus.map((menu) => (
            <Fragment key={menu.key}>
              <Button
                variant="text"
                color="inherit"
                endIcon={<KeyboardArrowDownOutlinedIcon fontSize="small" />}
                onClick={(event) =>
                  setAnchorMap((current) => ({
                    ...current,
                    [menu.key]: event.currentTarget,
                  }))
                }
                sx={{
                  minHeight: 30,
                  px: 1,
                  fontSize: "0.79rem",
                  fontWeight: 600,
                  color: "#334155",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(15,23,42,0.05)" },
                }}
                aria-label={`${menu.label} menu`}
              >
                {menu.label}
              </Button>
              <Menu
                anchorEl={anchorMap[menu.key] ?? null}
                open={Boolean(anchorMap[menu.key])}
                onClose={() =>
                  setAnchorMap((current) => ({
                    ...current,
                    [menu.key]: null,
                  }))
                }
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{
                  paper: {
                    sx: {
                      minWidth: 220,
                      mt: 0.5,
                      borderRadius: 1,
                      border: "1px solid rgba(15,23,42,0.12)",
                      boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                    },
                  },
                }}
              >
                {menu.items.map((item) => (
                  <MenuItem
                    key={`${menu.key}-${item.label}`}
                    onClick={() => {
                      setAnchorMap((current) => ({
                        ...current,
                        [menu.key]: null,
                      }));
                      item.onClick?.();
                    }}
                    disabled={item.disabled}
                    sx={{
                      py: 0.85,
                      fontSize: "0.84rem",
                      color: item.danger ? "#b91c1c" : "#0f172a",
                    }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </Fragment>
          ))}
        </Stack>

        {statusContent ? (
          <Tooltip title="Workspace status">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.74rem", letterSpacing: "0.02em" }}>
                {statusContent}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <MoreHorizOutlinedIcon sx={{ fontSize: "0.95rem", color: "#94a3b8" }} />
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.74rem" }}>
              Command bar
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
