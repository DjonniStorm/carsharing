import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TariffUpdateBody } from "@/entities/tariff";
import { tariffsApi } from "@/features/tariffs/api";
import { loadTariffsCatalog } from "@/features/tariffs/model/tariffs-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Snapshot = {
  name: string;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
  isDefault: boolean;
};

function parsePrice(value: number | string): number | null {
  const n =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return Math.round(n * 100) / 100;
}

function snapshotFromForm(
  name: string,
  pricePerMinute: number | string,
  pricePerKm: number | string,
  pausePricePerMinute: number | string,
  isDefault: boolean,
): Snapshot | null {
  const ppm = parsePrice(pricePerMinute);
  const pk = parsePrice(pricePerKm);
  const pp = parsePrice(pausePricePerMinute);
  if (ppm === null || pk === null || pp === null) {
    return null;
  }
  return {
    name: name.trim(),
    pricePerMinute: ppm,
    pricePerKm: pk,
    pausePricePerMinute: pp,
    isDefault,
  };
}

const TariffEditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadTariffs = useAction(loadTariffsCatalog);

  const params = useParams({ strict: false }) as { tariffId?: string };
  const tariffId = params.tariffId ?? "";

  const snapshotRef = useRef<Snapshot | null>(null);

  const [phase, setPhase] = useState<"loading" | "ok" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isDeleted, setIsDeleted] = useState(false);

  const [name, setName] = useState("");
  const [pricePerMinute, setPricePerMinute] = useState<number | string>(0);
  const [pricePerKm, setPricePerKm] = useState<number | string>(0);
  const [pausePricePerMinute, setPausePricePerMinute] = useState<
    number | string
  >(0);
  const [isDefault, setIsDefault] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);

  useEffect(() => {
    if (!tariffId) {
      setPhase("error");
      setLoadError(t(LANG_KEYS.pages.tariffsEditNotFound));
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setLoadError(null);

    void (async () => {
      try {
        const row = await tariffsApi.findById(tariffId);
        if (cancelled) {
          return;
        }
        setIsDeleted(row.isDeleted);
        setName(row.name);
        setPricePerMinute(row.pricePerMinute);
        setPricePerKm(row.pricePerKm);
        setPausePricePerMinute(row.pausePricePerMinute);
        setIsDefault(row.isDefault);
        snapshotRef.current = {
          name: row.name.trim(),
          pricePerMinute: row.pricePerMinute,
          pricePerKm: row.pricePerKm,
          pausePricePerMinute: row.pausePricePerMinute,
          isDefault: row.isDefault,
        };
        setPhase("ok");
      } catch (e) {
        if (cancelled) {
          return;
        }
        const msg =
          e instanceof HttpApiError && e.status === 404
            ? String(t(LANG_KEYS.pages.tariffsEditNotFound))
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
  }, [tariffId, t]);

  const save = useCallback(async () => {
    setFormError(null);
    if (!tariffId || phase !== "ok" || isDeleted) {
      return;
    }

    const next = snapshotFromForm(
      name,
      pricePerMinute,
      pricePerKm,
      pausePricePerMinute,
      isDefault,
    );
    if (!next) {
      setFormError(t(LANG_KEYS.pages.tariffsCreatePricesInvalid));
      return;
    }
    if (!next.name) {
      setFormError(t(LANG_KEYS.pages.tariffsCreateNameRequired));
      return;
    }

    const prev = snapshotRef.current;
    if (prev !== null && JSON.stringify(next) === JSON.stringify(prev)) {
      notifications.show({
        message: t(LANG_KEYS.pages.tariffsEditNothingToSave),
        color: "blue",
      });
      return;
    }

    const body: TariffUpdateBody = {
      name: next.name,
      pricePerMinute: next.pricePerMinute,
      pricePerKm: next.pricePerKm,
      pausePricePerMinute: next.pausePricePerMinute,
      isDefault: next.isDefault,
    };

    setSubmitting(true);
    try {
      const updated = await tariffsApi.update(tariffId, body);
      snapshotRef.current = {
        name: updated.name.trim(),
        pricePerMinute: updated.pricePerMinute,
        pricePerKm: updated.pricePerKm,
        pausePricePerMinute: updated.pausePricePerMinute,
        isDefault: updated.isDefault,
      };
      setIsDeleted(updated.isDeleted);
      notifications.show({
        title: t(LANG_KEYS.pages.tariffsEditSuccess),
        color: "green",
      });
      void reloadTariffs({ includeDeleted: true });
      void navigate({ to: ROUTES.dashboard.tariffs });
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
    isDefault,
    isDeleted,
    name,
    navigate,
    pausePricePerMinute,
    phase,
    pricePerKm,
    pricePerMinute,
    reloadTariffs,
    t,
    tariffId,
  ]);

  const confirmDelete = useCallback(async () => {
    setFormError(null);
    if (!tariffId || phase !== "ok" || isDeleted) {
      return;
    }
    setSubmitting(true);
    try {
      const updated = await tariffsApi.delete(tariffId);
      setIsDeleted(updated.isDeleted);
      notifications.show({
        title: t(LANG_KEYS.pages.tariffsDeleteSuccess),
        color: "green",
      });
      void reloadTariffs({ includeDeleted: true });
      setDeleteOpened(false);
      void navigate({ to: ROUTES.dashboard.tariffs });
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
  }, [isDeleted, navigate, phase, reloadTariffs, t, tariffId]);

  if (phase === "loading") {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader />
            <Text c="dimmed">{t(LANG_KEYS.pages.tariffsEditLoading)}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (phase === "error") {
    return (
      <Container size="sm" py="md" px="md">
        <Stack gap="md">
          <Title order={2}>{t(LANG_KEYS.pages.tariffsEditorEditTitle)}</Title>
          <Alert color="red">{loadError}</Alert>
          <Link
            to={ROUTES.dashboard.tariffs}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="light">
              {t(LANG_KEYS.pages.tariffsCreateCancel)}
            </Button>
          </Link>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Title order={2}>{t(LANG_KEYS.pages.tariffsEditorEditTitle)}</Title>
          <Link
            to={ROUTES.dashboard.tariffs}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.tariffsCreateCancel)}
            </Button>
          </Link>
        </Group>

        {isDeleted ? (
          <Alert color="gray">
            {t(LANG_KEYS.pages.tariffsEditDeletedHint)}
          </Alert>
        ) : null}

        {formError ? (
          <Alert color="red" onClose={() => setFormError(null)} withCloseButton>
            {formError}
          </Alert>
        ) : null}

        <TextInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldName)}
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
          required
          readOnly={isDeleted}
        />

        <NumberInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldPriceMin)}
          value={pricePerMinute}
          onChange={setPricePerMinute}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          readOnly={isDeleted}
        />

        <NumberInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldPriceKm)}
          value={pricePerKm}
          onChange={setPricePerKm}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          readOnly={isDeleted}
        />

        <NumberInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldPausePrice)}
          value={pausePricePerMinute}
          onChange={setPausePricePerMinute}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          readOnly={isDeleted}
        />

        <Switch
          label={t(LANG_KEYS.pages.tariffsCreateFieldIsDefault)}
          checked={isDefault}
          onChange={(e) => setIsDefault(e.currentTarget.checked)}
          disabled={isDeleted}
        />

        <Group gap="sm" wrap="wrap">
          <Button
            onClick={() => void save()}
            loading={submitting}
            disabled={isDeleted}
          >
            {t(LANG_KEYS.pages.tariffsEditSave)}
          </Button>
          <Button
            variant="outline"
            color="red"
            onClick={() => setDeleteOpened(true)}
            disabled={isDeleted || submitting}
          >
            {t(LANG_KEYS.pages.tariffsEditDelete)}
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        title={t(LANG_KEYS.pages.tariffsEditDeleteConfirmTitle)}
      >
        <Stack gap="md">
          <Text size="sm">
            {t(LANG_KEYS.pages.tariffsEditDeleteConfirmBody)}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setDeleteOpened(false)}>
              {t(LANG_KEYS.pages.tariffsCreateCancel)}
            </Button>
            <Button color="red" onClick={() => void confirmDelete()}>
              {t(LANG_KEYS.pages.tariffsEditDelete)}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};
TariffEditPage.displayName = "TariffEditPage";

export { TariffEditPage };
