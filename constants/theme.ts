// constants/theme.ts
export const colors = {
  light: {
    tint: "#7B5CF5",
    primary: "#7B5CF5",
    accent: "#4DB6FF",
    background: "#FFF8F2",
    card: "#FFFFFF",
    text: "#3A2E2E",
    muted: "#8C7B75",
  },
  dark: {
    tint: "#7B5CF5",
    primary: "#7B5CF5",
    accent: "#4DB6FF",
    background: "#1E1A1A",
    card: "#2A2424",
    text: "#FFFFFF",
    muted: "#B8AFAF",
  },
  // Flat fallback
  primary: "#7B5CF5",
  accent: "#4DB6FF",
  background: "#FFF8F2",
  card: "#FFFFFF",
  text: "#3A2E2E",
  muted: "#8C7B75",
};

export const fonts = {
  // Font families dengan fallback system fonts
  title: "Baloo2_700Bold",
  titleFallback: "System", // iOS fallback
  
  subtitle: "Baloo2_600SemiBold", 
  subtitleFallback: "System",
  
  body: "Nunito_500Medium", // Ganti ke Medium untuk lebih tebal
  bodyFallback: "System",
  
  bodyBold: "Nunito_700Bold",
  bodyBoldFallback: "System",
  
  bodySemiBold: "Nunito_600SemiBold",
  bodySemiBoldFallback: "System",
  
  // Font sizes
  sizes: {
    title: 24,
    subtitle: 18,
    body: 16,
    small: 14,
    caption: 12,
  },
  
  // Font weights untuk fallback
  weights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  }
};