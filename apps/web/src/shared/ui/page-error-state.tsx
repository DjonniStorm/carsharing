import { Alert, Button, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Props = {
  title?: LangKey;
  message: string;
  onRetry?: () => void;
};

const PageErrorState = ({
  title = LANG_KEYS.common.errorTitle,
  message,
  onRetry,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Alert color="red" title={t(title)}>
      <Stack gap="sm" align="flex-start">
        {message}
        {onRetry ? (
          <Button size="xs" variant="light" onClick={onRetry}>
            {t(LANG_KEYS.common.retry)}
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
};
PageErrorState.displayName = "PageErrorState";

export { PageErrorState };
