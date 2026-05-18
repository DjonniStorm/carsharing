import { Center, Loader, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Props = {
  messageKey?: LangKey;
  py?: string | number;
};

const PageLoader = ({
  messageKey = LANG_KEYS.common.loading,
  py = "xl",
}: Props) => {
  const { t } = useTranslation();

  return (
    <Center py={py}>
      <Stack align="center" gap="sm">
        <Loader />
        {messageKey ? (
          <Text size="sm" c="dimmed">
            {t(messageKey)}
          </Text>
        ) : null}
      </Stack>
    </Center>
  );
};
PageLoader.displayName = "PageLoader";

export { PageLoader };
