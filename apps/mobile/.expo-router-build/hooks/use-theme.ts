import { themes } from "@/constants/theme";
import { useSessionStore } from "@/store/session-store";

export function useTheme() {
  const themePreference = useSessionStore((state) => state.themePreference);
  return themes[themePreference];
}
