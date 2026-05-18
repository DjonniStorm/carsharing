import {
  Alert,
  Button,
  Container,
  Group,
  Select,
  Stack,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import { buildViolationCreatableStatusSelectData } from "@/features/violations/lib/violation-status-present";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useViolationCreateSubmit } from "@/pages/violations/hooks/use-violation-create-submit";

const ViolationCreatePage = () => {
  const { t } = useTranslation();
  const form = useViolationCreateSubmit();
  const typeSelectData = buildViolationCreatableStatusSelectData(t);

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Title order={2}>{t(LANG_KEYS.pages.violationsEditorNewTitle)}</Title>
          <Link
            to={ROUTES.dashboard.violations}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.violationsCreateCancel)}
            </Button>
          </Link>
        </Group>

        {form.formError ? (
          <Alert
            color="red"
            onClose={() => form.setFormError(null)}
            withCloseButton
          >
            {form.formError}
          </Alert>
        ) : null}

        <TextInput
          label={t(LANG_KEYS.pages.violationsCreateFieldTripId)}
          value={form.tripId}
          onChange={(event) => form.setTripId(event.currentTarget.value)}
          required
          ff="monospace"
        />
        <Select
          label={t(LANG_KEYS.pages.violationsCreateFieldType)}
          data={typeSelectData}
          value={String(form.type)}
          onChange={(value) => {
            if (value !== null) {
              form.setType(Number(value) as ViolationStatus);
            }
          }}
        />
        <Textarea
          label={t(LANG_KEYS.pages.violationsCreateFieldDescription)}
          value={form.description}
          onChange={(event) => form.setDescription(event.currentTarget.value)}
          required
          autosize
          minRows={3}
        />
        <Button onClick={() => void form.submit()} loading={form.submitting}>
          {t(LANG_KEYS.pages.violationsCreateSubmit)}
        </Button>
      </Stack>
    </Container>
  );
};
ViolationCreatePage.displayName = "ViolationCreatePage";

export { ViolationCreatePage };
