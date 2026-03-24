export type AppTheme = {
  background: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
  border: string;
  canvas: string;
  spotlight: string;
  highlight: string;
  glowTop: string;
  glowSide: string;
  glowBottom: string;
};

export type ThemeOption = "black_white" | "pink" | "beige" | "blue";

export const themes: Record<ThemeOption, AppTheme> = {
  black_white: {
    background: "#F7F7F7",
    card: "#FFFFFF",
    text: "#111111",
    muted: "#5F5F5F",
    primary: "#111111",
    accent: "#D9D9D9",
    border: "#DADADA",
    canvas: "#EFEFEF",
    spotlight: "#FAFAFA",
    highlight: "#808080",
    glowTop: "rgba(32, 32, 32, 0.10)",
    glowSide: "rgba(120, 120, 120, 0.08)",
    glowBottom: "rgba(210, 210, 210, 0.18)"
  },
  pink: {
    background: "#FFF4F8",
    card: "#FFFFFF",
    text: "#4B1430",
    muted: "#8A5770",
    primary: "#FF2F92",
    accent: "#FFD2E8",
    border: "#F4C7DA",
    canvas: "#FFE7F1",
    spotlight: "#FFF7FB",
    highlight: "#FF86BE",
    glowTop: "rgba(255, 111, 173, 0.18)",
    glowSide: "rgba(255, 47, 146, 0.10)",
    glowBottom: "rgba(255, 210, 232, 0.28)"
  },
  beige: {
    background: "#FFF9F4",
    card: "#FFFFFF",
    text: "#2D1B14",
    muted: "#6D5C56",
    primary: "#C67658",
    accent: "#F7C9B6",
    border: "#E7D8CB",
    canvas: "#F8F0E8",
    spotlight: "#FFF1E7",
    highlight: "#C49A52",
    glowTop: "rgba(198, 118, 88, 0.16)",
    glowSide: "rgba(196, 154, 82, 0.10)",
    glowBottom: "rgba(247, 201, 182, 0.22)"
  },
  blue: {
    background: "#F6FAFF",
    card: "#FFFFFF",
    text: "#24415E",
    muted: "#6F86A0",
    primary: "#8EBEFF",
    accent: "#DCEBFF",
    border: "#D7E7FA",
    canvas: "#EDF5FF",
    spotlight: "#FBFDFF",
    highlight: "#B2D2FF",
    glowTop: "rgba(142, 190, 255, 0.18)",
    glowSide: "rgba(178, 210, 255, 0.12)",
    glowBottom: "rgba(220, 235, 255, 0.28)"
  }
};

export const themeLabels: Record<ThemeOption, string> = {
  black_white: "Black and white",
  pink: "Hot pink and light pink",
  beige: "Beige and white",
  blue: "Shades of blue"
};
