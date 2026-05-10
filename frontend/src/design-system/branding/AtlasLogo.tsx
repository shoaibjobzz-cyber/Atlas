import { Box } from "@mui/material";
import {
  atlasLogoAssets,
  atlasLogoCropByVariant,
  atlasLogoHeightBySize,
  type AtlasLogoSize,
  type AtlasLogoTone,
  type AtlasLogoVariant,
} from "./atlasBranding";

type AtlasLogoProps = {
  size?: AtlasLogoSize;
  variant?: AtlasLogoVariant;
  tone?: AtlasLogoTone;
  className?: string;
  polished?: boolean;
};

export default function AtlasLogo({
  size = "medium",
  variant = "full",
  tone = "auto",
  className,
  polished = false,
}: AtlasLogoProps) {
  const logoHeight = atlasLogoHeightBySize[size];
  const resolvedTone = tone === "auto" ? "dark" : tone;
  const logoSrc = atlasLogoAssets[resolvedTone];
  const showPolish = polished && variant === "full" && size === "large";

  if (variant === "full") {
    return (
      <Box
        className={className}
        sx={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "fit-content",
          maxWidth: "100%",
          isolation: "isolate",
          "&::after": showPolish
            ? {
                content: '""',
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(104deg, rgba(255,255,255,0) 18%, rgba(255,255,255,0.18) 34%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 58%)",
                mixBlendMode: "screen",
                opacity: 0.9,
              }
            : {},
        }}
      >
        <Box
          component="img"
          src={logoSrc}
          alt="Atlas logo"
          draggable={false}
          sx={{
            display: "block",
            height: logoHeight,
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            userSelect: "none",
            transform: "translateZ(0)",
            filter: showPolish
              ? "drop-shadow(0 1px 0 rgba(255,255,255,0.22)) drop-shadow(0 0 8px rgba(255,255,255,0.08))"
              : "none",
          }}
        />
      </Box>
    );
  }

  const crop = atlasLogoCropByVariant[variant];
  const cropWidth = logoHeight * crop.widthMultiplier;
  const translateX = -logoHeight * crop.offsetMultiplier;

  return (
    <Box
      className={className}
      sx={{
        width: cropWidth,
        height: logoHeight,
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={logoSrc}
        alt={variant === "icon-only" ? "Atlas icon" : "Atlas wordmark"}
        draggable={false}
        sx={{
          display: "block",
          height: logoHeight,
          width: "auto",
          maxWidth: "none",
          objectFit: "contain",
          objectPosition: "left center",
          userSelect: "none",
          transform: `translateX(${translateX}px) translateZ(0)`,
        }}
      />
    </Box>
  );
}
