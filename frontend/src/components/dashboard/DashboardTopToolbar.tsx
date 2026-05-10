import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Box, Divider, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import AppIconActionButton from "../common/AppIconActionButton";
import type { DashboardSummary } from "../../types/dashboard";

type DashboardTopToolbarProps = {
  summary: DashboardSummary;
  currentUserName?: string;
  onCloseProject?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
};

export default function DashboardTopToolbar({
  summary,
  currentUserName,
  onCloseProject,
  onOpenSettings,
  onSignOut,
}: DashboardTopToolbarProps) {
  const subtitleParts = [summary.status, summary.baseline].filter(Boolean);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("atlas.projectToolbarPinned") === "true";
  });
  const [isRevealed, setIsRevealed] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem("atlas.projectToolbarPinned") === "true";
  });
  const [measuredHeight, setMeasuredHeight] = useState(84);

  const activationZoneHeight = 10;
  const isVisible = isPinned || isRevealed;

  useEffect(() => {
    const node = toolbarRef.current;
    if (!node) {
      return;
    }

    function updateHeight() {
      if (!node) {
        return;
      }
      setMeasuredHeight(node.scrollHeight);
    }

    updateHeight();

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateHeight) : null;
    observer?.observe(node);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [currentUserName, summary.baseline, summary.projectName, summary.status]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  function cancelHide() {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function revealToolbar() {
    cancelHide();
    setIsRevealed(true);
  }

  function scheduleHide() {
    cancelHide();
    if (isPinned || Boolean(profileAnchor) || Boolean(moreAnchor)) {
      return;
    }
    hideTimerRef.current = window.setTimeout(() => {
      setIsRevealed(false);
      hideTimerRef.current = null;
    }, 220);
  }

  function handleOpenProfileMenu(event: React.MouseEvent<HTMLElement>) {
    revealToolbar();
    setProfileAnchor(event.currentTarget);
  }

  function handleCloseProfileMenu() {
    setProfileAnchor(null);
  }

  function handleOpenMoreMenu(event: React.MouseEvent<HTMLElement>) {
    revealToolbar();
    setMoreAnchor(event.currentTarget);
  }

  function handleCloseMoreMenu() {
    setMoreAnchor(null);
  }

  async function handleSignOut() {
    handleCloseProfileMenu();
    await onSignOut?.();
  }

  function handleCloseProject() {
    handleCloseMoreMenu();
    onCloseProject?.();
  }

  function handlePinToggle() {
    setIsPinned((current) => {
      const next = !current;
      window.localStorage.setItem("atlas.projectToolbarPinned", String(next));
      if (next) {
        cancelHide();
        setIsRevealed(true);
      } else {
        setIsRevealed(true);
      }
      return next;
    });
  }

  return (
    <Box
      sx={{
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: isVisible ? `${measuredHeight}px` : `${activationZoneHeight}px`,
        transition: "height 200ms ease",
      }}
      onMouseEnter={revealToolbar}
      onMouseLeave={scheduleHide}
      onFocusCapture={revealToolbar}
      onBlurCapture={(event) => {
        const currentTarget = event.currentTarget;
        window.setTimeout(() => {
          if (!currentTarget.contains(document.activeElement)) {
            scheduleHide();
          }
        }, 0);
      }}
    >
      <Box
        tabIndex={0}
        aria-label={`Reveal ${summary.projectName} project header`}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: activationZoneHeight,
          zIndex: 11,
          outline: "none",
          bgcolor: "transparent",
          "&:focus-visible::after": {
            bgcolor: "rgba(37,99,235,0.42)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            left: 24,
            right: 24,
            top: 0,
            height: 2,
            borderRadius: 999,
            bgcolor: isVisible ? "transparent" : "rgba(148,163,184,0.22)",
            transition: "background-color 180ms ease, opacity 180ms ease",
            opacity: isVisible ? 0 : 1,
          },
        }}
      />

      <Box
        ref={toolbarRef}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          borderBottom: "1px solid rgba(226,232,240,0.92)",
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          px: { xs: 2, md: 3 },
          py: { xs: 1.1, md: 1.2 },
          willChange: "transform, opacity",
          transform: isVisible
            ? "translateY(0)"
            : `translateY(calc(-100% + ${activationZoneHeight}px))`,
          opacity: isVisible ? 1 : 0.98,
          transition:
            "transform 200ms ease, opacity 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
          boxShadow: isVisible ? "0 6px 16px rgba(15,23,42,0.04)" : "none",
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={{ xs: 1.25, lg: 2 }}
          justifyContent="space-between"
          alignItems={{ lg: "center" }}
        >
          <Box sx={{ minWidth: 0, pr: { lg: 3 } }}>
            <Typography
              variant="h5"
              fontWeight={700}
              color="#0f172a"
              sx={{ lineHeight: 1.05, letterSpacing: "-0.02em", fontSize: { xs: "1.25rem", md: "1.35rem" } }}
            >
              {summary.projectName}
            </Typography>
            {subtitleParts.length > 0 ? (
              <Typography
                variant="body2"
                color="#64748b"
                sx={{ mt: 0.35, fontSize: "0.76rem", letterSpacing: "0.01em" }}
              >
                {subtitleParts.join(" • ")}
              </Typography>
            ) : null}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            useFlexGap
            flexWrap="wrap"
            flexShrink={0}
            sx={{ pl: { lg: 2 }, justifyContent: { xs: "flex-start", lg: "flex-end" } }}
          >
            <AppIconActionButton
              title="Workspace filters are available within each project view."
              ariaLabel="Workspace filters"
            >
              <FilterAltOutlinedIcon fontSize="small" />
            </AppIconActionButton>

            <AppIconActionButton title="Project Settings" ariaLabel="Project Settings" onClick={onOpenSettings}>
              <SettingsOutlinedIcon fontSize="small" />
            </AppIconActionButton>

            <AppIconActionButton
              title={currentUserName ? `Signed in as ${currentUserName}` : "Signed-in user"}
              ariaLabel="User profile"
              onClick={handleOpenProfileMenu}
            >
              <AccountCircleOutlinedIcon fontSize="small" />
            </AppIconActionButton>
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={handleCloseProfileMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 2,
                    border: "1px solid rgba(226,232,240,0.92)",
                    boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
                  },
                },
              }}
            >
              <Box sx={{ px: 1.75, pt: 1.5, pb: 1 }}>
                <Typography
                  variant="caption"
                  color="#64748b"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  Account
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#0f172a" sx={{ mt: 0.35 }}>
                  {currentUserName ?? "Signed-in user"}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => void handleSignOut()} disabled={!onSignOut} sx={{ gap: 1.25, py: 1.1 }}>
                <LogoutOutlinedIcon fontSize="small" />
                <Typography variant="body2" fontWeight={600}>
                  Sign Out
                </Typography>
              </MenuItem>
            </Menu>

            <AppIconActionButton
              title={isPinned ? "Unpin Project Header" : "Pin Project Header"}
              ariaLabel={isPinned ? "Unpin Project Header" : "Pin Project Header"}
              onClick={handlePinToggle}
            >
              <PushPinOutlinedIcon
                fontSize="small"
                sx={{ transform: isPinned ? "rotate(0deg)" : "rotate(35deg)", transition: "transform 140ms ease" }}
              />
            </AppIconActionButton>

            <AppIconActionButton title="More actions" ariaLabel="More project actions" onClick={handleOpenMoreMenu}>
              <MoreHorizOutlinedIcon fontSize="small" />
            </AppIconActionButton>
            <Menu
              anchorEl={moreAnchor}
              open={Boolean(moreAnchor)}
              onClose={handleCloseMoreMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    border: "1px solid rgba(226,232,240,0.92)",
                    boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
                  },
                },
              }}
            >
              <MenuItem onClick={handleCloseProject} disabled={!onCloseProject} sx={{ gap: 1.25, py: 1.1 }}>
                <CloseOutlinedIcon fontSize="small" />
                <Typography variant="body2" fontWeight={600}>
                  Close Project
                </Typography>
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
