import { MantineProvider } from "@mantine/core";

import { Notifications } from "@mantine/notifications";

import { reatomContext } from "@reatom/react";

import { RouterProvider } from "@tanstack/react-router";

import { I18nextProvider } from "react-i18next";

import "@mantine/notifications/styles.css";

import { router } from "@/app/router";

import { rootFrame } from "@/app/store";

import { SessionBootstrap } from "@/features/auth/ui/session-bootstrap";

import i18n from "@/shared/i18n/i18n";
import { getStoredColorSchemeOrFallback } from "@/shared/lib/color-scheme";

const initialColorScheme = getStoredColorSchemeOrFallback();

const AppProviders = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <reatomContext.Provider value={rootFrame}>
        <MantineProvider defaultColorScheme={initialColorScheme}>
          <Notifications position="top-right" zIndex={4000} />

          <SessionBootstrap />

          <RouterProvider router={router} />
        </MantineProvider>
      </reatomContext.Provider>
    </I18nextProvider>
  );
};

AppProviders.displayName = "AppProviders";

export { AppProviders };
