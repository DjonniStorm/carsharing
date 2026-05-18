export type SupportedColorScheme = "light" | "dark" | "auto";

export const COLOR_SCHEME_STORAGE_KEY = "app_ui_color_scheme";

export const SUPPORTED_COLOR_SCHEMES: readonly SupportedColorScheme[] = [
  "light",
  "dark",
  "auto",
] as const;

export function getStoredColorScheme(): SupportedColorScheme | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  const raw = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "auto") {
    return raw;
  }
  return undefined;
}

export function getStoredColorSchemeOrFallback(): SupportedColorScheme {
  return getStoredColorScheme() ?? "auto";
}

export function persistColorScheme(scheme: SupportedColorScheme): void {
  localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
}
