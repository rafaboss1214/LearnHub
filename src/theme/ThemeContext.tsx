import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useMemo, useState } from "react";

export type ThemeColors = {
  background: string;
  card: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  yellow: string;
  border: string;
  success: string;
  danger: string;
};

type ThemeContextType = {
  dark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
};

const lightColors: ThemeColors = {
  background: "#F5F7FB",
  card: "#FFFFFF",
  surface: "#EEF2FF",
  text: "#182033",
  muted: "#687089",
  primary: "#6558E8",
  primarySoft: "#E9E7FF",
  accent: "#F4B740",
  yellow: "#F4B740",
  border: "#E1E5EE",
  success: "#239B72",
  danger: "#D84A5B",
};

const darkColors: ThemeColors = {
  background: "#0D1120",
  card: "#171C2E",
  surface: "#202640",
  text: "#F6F7FB",
  muted: "#A6AEC5",
  primary: "#958BFF",
  primarySoft: "#2C2858",
  accent: "#F4C15D",
  yellow: "#F4C15D",
  border: "#2A3148",
  success: "#4BC49A",
  danger: "#FF7180",
};

export const ThemeContext = createContext({} as ThemeContextType);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("tema").then((theme) => setDark(theme === "dark"));
  }, []);

  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      void AsyncStorage.setItem("tema", next ? "dark" : "light");
      return next;
    });
  }

  const value = useMemo(
    () => ({ dark, toggleTheme, colors: dark ? darkColors : lightColors }),
    [dark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
