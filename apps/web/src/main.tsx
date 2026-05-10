import "@/shared/i18n/i18n";
import i18n from "@/shared/i18n/i18n";

document.documentElement.lang = i18n.language.startsWith("en") ? "en" : "ru";

import "@mantine/charts/styles.css";
import "@mantine/core/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "@/app/providers/app-providers";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
