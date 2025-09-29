// constants/theme.ts - Updated version
export const colors = {
  light: {
    tint: "#7B5CF5",
    primary: "#7B5CF5",
    accent: "#4DB6FF",
    background: "#FFF8F2",
    card: "#FFFFFF",
    text: "#3A2E2E",
    muted: "#8C7B75",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  dark: {
    tint: "#7B5CF5",
    primary: "#7B5CF5",
    accent: "#4DB6FF",
    background: "#1E1A1A",
    card: "#2A2424",
    text: "#FFFFFF",
    muted: "#B8AFAF",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  // Flat fallback
  primary: "#7B5CF5",
  accent: "#4DB6FF",
  background: "#FFF8F2",
  card: "#FFFFFF",
  text: "#3A2E2E",
  muted: "#8C7B75",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

export const fonts = {
  // Font families
  title: "Baloo2_800ExtraBold",
  titleMedium: "Baloo2_700Bold",
  subtitle: "Baloo2_600SemiBold", 
  body: "Nunito_600SemiBold",
  bodyRegular: "Nunito_500Medium",
  bodyBold: "Nunito_700Bold",
  bodyLight: "Nunito_400Regular",
  
  // Font sizes
  sizes: {
    title: 28,
    subtitle: 20,
    body: 17,
    small: 15,
    caption: 13,
    tiny: 11,
  },
  
  // Font weights
  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  }
};

// API-related constants
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Difficulty colors
export const DIFFICULTY_COLORS = {
  beginner: colors.success,
  intermediate: colors.warning,
  advanced: colors.error,
};

// XP and Level constants
export const XP_CONFIG = {
  BASE_XP_PER_LEVEL: 100,
  XP_MULTIPLIER: 1.5,
  STREAK_BONUS: 50,
  ACHIEVEMENT_BONUS: 100,
};