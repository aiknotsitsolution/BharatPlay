import { useContext } from "react";
import ThemeContext from "./theme-context-value";

export function useTheme() {
  return useContext(ThemeContext);
}
