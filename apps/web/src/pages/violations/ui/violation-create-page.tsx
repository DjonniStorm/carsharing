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
import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import {
  VIOLATION_CREATABLE_STATUSES_ORDERED,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import { violationsApi } from "@/features/violations/api";
import { loadViolationsAdminList } from "@/features/violations/model/violations-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

const UUID_RE =
  /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

const ViolationCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadList = useAction(loadViolationsAdminList);

  const [tripId, setTripId] = useState("");
  const [type, setType] = useState<ViolationStatus>(
    VIOLATION_CREATABLE_STATUSES_ORDERED[0],
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const typeSelectData = useMemo(() => {
    return VIOLATION_CREATABLE_STATUSES_ORDERED.map((s) => ({
      value: String(s),
      label: t(violationStatusLangKey(s)),
    }));
  }, [t]);

  const handleSubmit = async () => {
    setFormError(null);
    const tid = tripId.trim();
    if (!UUID_RE.test(tid)) {
      setFormError(t(LANG_KEYS.pages.violationsCreateTripIdInvalid));
      return;
    }
    const desc = description.trim();
    if (!desc) {
      setFormError(t(LANG_KEYS.pages.violationsColDesc));
      return;
    }

    setSubmitting(true);
    try {
      await violationsApi.create({
        tripId: tid,
        type,
        description: desc,
      });
      notifications.show({
        title: t(LANG_KEYS.pages.violationsEditorNewTitle),
        message: tid,
        color: "green",
      });
      void reloadList({ includeResolved: true });
      void navigate({ to: ROUTES.dashboard.violations });
    } catch (e) {
      const msg =
        e instanceof HttpApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

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

        {formError ? (
          <Alert color="red" onClose={() => setFormError(null)} withCloseButton>
            {formError}
          </Alert>
        ) : null}

        <TextInput
          label={t(LANG_KEYS.pages.violationsCreateFieldTripId)}
          value={tripId}
          onChange={(e) => setTripId(e.currentTarget.value)}
          required
          ff="monospace"
        />
        <Select
          label={t(LANG_KEYS.pages.violationsCreateFieldType)}
          data={typeSelectData}
          value={String(type)}
          onChange={(v) => {
            if (v !== null) {
              setType(Number(v) as ViolationStatus);
            }
          }}
        />
        <Textarea
          label={t(LANG_KEYS.pages.violationsCreateFieldDescription)}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          required
          autosize
          minRows={3}
        />
        <Button onClick={() => void handleSubmit()} loading={submitting}>
          {t(LANG_KEYS.pages.violationsCreateSubmit)}
        </Button>
      </Stack>
    </Container>
  );
};
ViolationCreatePage.displayName = "ViolationCreatePage";

export { ViolationCreatePage };
