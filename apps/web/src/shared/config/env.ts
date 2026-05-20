export const getApiBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5173";
  return raw.replace(/\/$/, "");
};

export const getYandexMapsApiKey = (): string => {
  return import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? "";
};
