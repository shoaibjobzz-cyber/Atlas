import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DatasetOutlinedIcon from "@mui/icons-material/DatasetOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HardwareOutlinedIcon from "@mui/icons-material/HardwareOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import PolylineOutlinedIcon from "@mui/icons-material/PolylineOutlined";
import SettingsEthernetOutlinedIcon from "@mui/icons-material/SettingsEthernetOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { AtlasLogo } from "../../design-system/branding";
import type { DashboardNavItem } from "../../types/dashboard";

type DashboardLeftNavProps = {
  items: DashboardNavItem[];
  activeKey: DashboardNavItem["key"];
  pinned?: boolean;
  onSelect?: (item: DashboardNavItem) => void;
  onTogglePinned?: () => void;
};

export default function DashboardLeftNav({
  items,
  activeKey,
  pinned = true,
  onSelect,
  onTogglePinned,
}: DashboardLeftNavProps) {
  const iconByKey: Record<DashboardNavItem["key"], JSX.Element> = {
    overview: <HomeOutlinedIcon fontSize="small" />,
    generate: <AutoAwesomeOutlinedIcon fontSize="small" />,
    graph: <PolylineOutlinedIcon fontSize="small" />,
    matrix: <TableChartOutlinedIcon fontSize="small" />,
    stakeholder: <DescriptionOutlinedIcon fontSize="small" />,
    system: <SettingsEthernetOutlinedIcon fontSize="small" />,
    subsystem: <AccountTreeOutlinedIcon fontSize="small" />,
    software: <MemoryOutlinedIcon fontSize="small" />,
    hardware: <HardwareOutlinedIcon fontSize="small" />,
    "design-data": <DatasetOutlinedIcon fontSize="small" />,
    dfmea: <ReportProblemOutlinedIcon fontSize="small" />,
    validation: <FactCheckOutlinedIcon fontSize="small" />,
    reports: <AssessmentOutlinedIcon fontSize="small" />,
  };

  return (
    <Box
      sx={{
        width: pinned ? 272 : 64,
        minWidth: pinned ? 272 : 64,
        flexShrink: 0,
        height: "100vh",
        bgcolor: "#0f1b2d",
        color: "#f8fafc",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        px: pinned ? 1.75 : 0.625,
        py: pinned ? 2.25 : 1.25,
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: pinned ? "auto" : "hidden",
        transition: "width 160ms ease, min-width 160ms ease, padding 160ms ease",
      }}
    >
      <Box sx={{ px: pinned ? 0.5 : 0, pb: pinned ? 1.25 : 0.625, flexShrink: 0 }}>
        <Box sx={{ display: "flex", justifyContent: pinned ? "flex-start" : "center", mb: pinned ? 1 : 0.625 }}>
          <AtlasLogo size={pinned ? "small" : "small"} variant={pinned ? "full" : "icon-only"} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: pinned ? "space-between" : "center", gap: 0.5 }}>
          <Box sx={{ flex: 1 }} />
          {pinned ? (
            <Tooltip title="Unpin menu" placement="right">
              <IconButton
                size="small"
                onClick={onTogglePinned}
                sx={{
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  width: 26,
                  height: 26,
                  flexShrink: 0,
                  "&:hover": {
                    backgroundColor: "rgba(148,163,184,0.10)",
                    borderColor: "rgba(255,255,255,0.16)",
                  },
                }}
              >
                <PushPinOutlinedIcon
                  sx={{
                    fontSize: 15,
                    transform: "rotate(0deg)",
                    transition: "transform 160ms ease",
                  }}
                />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: pinned ? 1.25 : 0.625, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minHeight: 0, overflowY: pinned ? "auto" : "hidden", overflowX: "hidden", pr: pinned ? 0.5 : 0 }}>
        <List disablePadding sx={{ mt: pinned ? 0.75 : 0.25, pb: pinned ? 0.75 : 0.25, minHeight: 0 }}>
          {items.map((item) => {
            const active = item.key === activeKey;
            const button = (
              <ListItemButton
                key={item.key}
                selected={active}
                disabled={item.disabled}
                onClick={() => onSelect?.(item)}
                sx={{
                  mb: pinned ? 0.375 : 0.25,
                  borderRadius: 1.5,
                  color: active ? "#f8fafc" : "#cbd5e1",
                  backgroundColor: active ? "rgba(37,99,235,0.22)" : "transparent",
                  justifyContent: pinned ? "flex-start" : "center",
                  px: pinned ? 1.25 : 0.375,
                  minHeight: pinned ? 38 : 32,
                  border: active ? "1px solid rgba(96,165,250,0.18)" : "1px solid transparent",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(37,99,235,0.22)",
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "rgba(37,99,235,0.28)",
                  },
                  "&:hover": {
                    backgroundColor: active ? "rgba(37,99,235,0.28)" : "rgba(148,163,184,0.08)",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(203,213,225,0.38)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: pinned ? 34 : "auto",
                    mr: 0,
                    color: "inherit",
                  }}
                >
                  {iconByKey[item.key]}
                </ListItemIcon>
                {pinned ? (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 13.5,
                      fontWeight: active ? 600 : 500,
                      letterSpacing: "0.01em",
                    }}
                  />
                ) : null}
              </ListItemButton>
            );
            return pinned ? (
              button
            ) : (
              <Tooltip key={item.key} title={item.label} placement="right">
                {button}
              </Tooltip>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
