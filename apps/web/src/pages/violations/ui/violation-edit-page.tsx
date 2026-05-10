import {
  Alert,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import { violationsApi } from "@/features/violations/api";
import {
  VIOLATION_STATUSES_ORDERED,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import { loadViolationsAdminList } from "@/features/violations/model/violations-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

const ViolationEditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadList = useAction(loadViolationsAdminList);

  const params = useParams({ strict: false }) as { violationId?: string };
  const violationId = params.violationId ?? "";

  const [phase, setPhase] = useState<"loading" | "ok" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tripId, setTripId] = useState("");
  const [description, setDescription] = useState("");
  const [persistedStatus, setPersistedStatus] =
    useState<ViolationStatus | null>(null);
  const [statusChoice, setStatusChoice] = useState<ViolationStatus>(
    ViolationStatus.UNKNOWN,
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!violationId) {
      setPhase("error");
      setLoadError(t(LANG_KEYS.pages.violationsEditNotFound));
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setLoadError(null);

    void (async () => {
      try {
        const v = await violationsApi.findById(violationId);
        if (cancelled) {
          return;
        }
        setTripId(v.tripId);
        setDescription(v.description);
        setPersistedStatus(v.type);
        setStatusChoice(v.type);
        setPhase("ok");
      } catch (e) {
        if (cancelled) {
          return;
        }
        const msg =
          e instanceof HttpApiError && e.status === 404
            ? String(t(LANG_KEYS.pages.violationsEditNotFound))
            : e instanceof Error
              ? e.message
              : String(e);
        setLoadError(msg);
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [violationId, t]);

  const statusSelectData = useMemo(() => {
    return VIOLATION_STATUSES_ORDERED.map((s) => ({
      value: String(s),
      label: t(violationStatusLangKey(s)),
    }));
  }, [t]);

  const saveStatus = useCallback(async () => {
    setFormError(null);
    if (!violationId || phase !== "ok") {
      return;
    }
    if (persistedStatus === null || statusChoice === persistedStatus) {
      notifications.show({
        message: t(LANG_KEYS.pages.violationsEditNothingToSave),
        color: "blue",
      });
      return;
    }

    setSubmitting(true);
    try {
      await violationsApi.updateStatus(violationId, { status: statusChoice });
      setPersistedStatus(statusChoice);
      notifications.show({
        title: t(LANG_KEYS.pages.violationsEditSuccess),
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
  }, [
    navigate,
    phase,
    reloadList,
    statusChoice,
    t,
    persistedStatus,
    violationId,
  ]);

  const markResolved = useCallback(async () => {
    setFormError(null);
    if (!violationId || phase !== "ok") {
      return;
    }

    setSubmitting(true);
    try {
      await violationsApi.resolve(violationId);
      setPersistedStatus(ViolationStatus.RESOLVED);
      setStatusChoice(ViolationStatus.RESOLVED);
      notifications.show({
        title: t(LANG_KEYS.pages.violationsEditSuccess),
        message: t(LANG_KEYS.pages.violationsKindResolved),
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
  }, [navigate, phase, reloadList, t, violationId]);

  if (phase === "loading") {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader />
            <Text c="dimmed">{t(LANG_KEYS.pages.violationsLoading)}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (phase === "error") {
    return (
      <Container size="sm" py="md" px="md">
        <Stack gap="md">
          <Title order={2}>
            {t(LANG_KEYS.pages.violationsEditorEditTitle)}
          </Title>
          <Alert color="red">{loadError}</Alert>
          <Link
            to={ROUTES.dashboard.violations}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="light">
              {t(LANG_KEYS.pages.violationsCreateCancel)}
            </Button>
          </Link>
        </Stack>
      </Container>
    );
  }

  const isResolved = statusChoice === ViolationStatus.RESOLVED;

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>
              {t(LANG_KEYS.pages.violationsEditorEditTitle)}
            </Title>
            <Text size="sm" ff="monospace" c="dimmed">
              {violationId}
            </Text>
          </Stack>
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

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            {t(LANG_KEYS.pages.violationsEditTripReadonly)}
          </Text>
          <Text ff="monospace" size="sm">
            {tripId}
          </Text>
        </Stack>

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            {t(LANG_KEYS.pages.violationsEditDescReadonly)}
          </Text>
          <Textarea value={description} readOnly autosize minRows={3} />
        </Stack>

        <Stack gap="xs">
          <Text size="sm" fw={600}>
            {t(LANG_KEYS.pages.violationsEditCurrentStatus)}
          </Text>
          <Badge size="lg" variant="light">
            {persistedStatus !== null
              ? t(violationStatusLangKey(persistedStatus))
              : t(violationStatusLangKey(statusChoice))}
          </Badge>
        </Stack>

        <Select
          label={t(LANG_KEYS.pages.violationsEditNewStatus)}
          data={statusSelectData}
          value={String(statusChoice)}
          onChange={(v) => {
            if (v !== null) {
              setStatusChoice(Number(v) as ViolationStatus);
            }
          }}
        />

        <Group gap="sm" wrap="wrap">
          <Button onClick={() => void saveStatus()} loading={submitting}>
            {t(LANG_KEYS.pages.violationsEditSaveStatus)}
          </Button>
          <Button
            variant="light"
            color="green"
            onClick={() => void markResolved()}
            loading={submitting}
            disabled={isResolved}
          >
            {t(LANG_KEYS.pages.violationsEditResolve)}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};
ViolationEditPage.displayName = "ViolationEditPage";

export { ViolationEditPage };
