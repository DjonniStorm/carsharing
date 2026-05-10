import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { SupportedLanguage } from "@/shared/i18n/language";
import { persistLanguage } from "@/shared/i18n/language";

const ShellLanguageControl = () => {
  const { i18n } = useTranslation();
  const value: SupportedLanguage = i18n.language.startsWith("en")
    ? "en"
    : "ru";

  return (
    <SegmentedControl
      size="xs"
      value={value}
      onChange={(v) => {
        const lang = v as SupportedLanguage;
        void i18n.changeLanguage(lang);
        persistLanguage(lang);
        document.documentElement.lang = lang;
      }}
      data={[
        { label: "RU", value: "ru" },
        { label: "EN", value: "en" },
      ]}
    />
  );
};
ShellLanguageControl.displayName = "ShellLanguageControl";

export { ShellLanguageControl };
