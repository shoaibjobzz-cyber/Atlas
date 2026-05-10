import atlasLogoDark from "./assets/atlas-logo.png";

export type AtlasLogoSize = "small" | "medium" | "large";
export type AtlasLogoVariant = "full" | "icon-only" | "text-only";
export type AtlasLogoTone = "auto" | "light" | "dark";

export const atlasLogoHeightBySize: Record<AtlasLogoSize, number> = {
  small: 24,
  medium: 32,
  large: 48,
};

export const atlasLogoAssets: Record<Exclude<AtlasLogoTone, "auto">, string> = {
  light: atlasLogoDark,
  dark: atlasLogoDark,
};

type AtlasCropConfig = {
  widthMultiplier: number;
  offsetMultiplier: number;
};

export const atlasLogoCropByVariant: Record<Exclude<AtlasLogoVariant, "full">, AtlasCropConfig> = {
  "icon-only": {
    widthMultiplier: 1,
    offsetMultiplier: 0,
  },
  "text-only": {
    widthMultiplier: 2.5,
    offsetMultiplier: 1.02,
  },
};
