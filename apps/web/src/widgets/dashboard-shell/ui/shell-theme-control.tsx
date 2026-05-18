import { SegmentedControl, useMantineColorScheme } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { SupportedColorScheme } from "@/shared/lib/color-scheme";
import { persistColorScheme } from "@/shared/lib/color-scheme";
import { LANG_KEYS } from "@/shared/i18n/keys";

const ShellThemeControl = () => {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const value: SupportedColorScheme =
    colorScheme === "light" || colorScheme === "dark" || colorScheme === "auto"
      ? colorScheme
      : "auto";

  return (
    <SegmentedControl
      size="xs"
      fullWidth
      value={value}
      onChange={(next) => {
        const scheme = next as SupportedColorScheme;
        setColorScheme(scheme);
        persistColorScheme(scheme);
      }}
      data={[
        {
          label: t(LANG_KEYS.pages.profileThemeLight),
          value: "light",
        },
        {
          label: t(LANG_KEYS.pages.profileThemeDark),
          value: "dark",
        },
        {
          label: t(LANG_KEYS.pages.profileThemeAuto),
          value: "auto",
        },
      ]}
    />
  );
};
ShellThemeControl.displayName = "ShellThemeControl";

export { ShellThemeControl };
