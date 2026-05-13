import {
  Alert,
  Button,
  Center,
  ColorInput,
  Container,
  Group,
  Loader,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  GeozoneUpdateBody,
  GeozoneVersionCreateBody,
} from "@/entities/geozone";
import { GeozoneType } from "@/entities/geozone";
import type { TariffRead } from "@/entities/tariff";
import { geozonesApi } from "@/features/geozones/api";
import type { GeozoneDrawMode } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import { GeozoneDrawMap } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import {
  ensureClosedRing,
  isValidClosedRing,
  multiPolygonFirstOuterRing,
  rectangleFromDiagonal,
  ringToMultiPolygon,
} from "@/features/geozones/lib/geojson-ring";
import { pickDefaultTariffPresetId } from "@/features/geozones/lib/pick-default-tariff-preset";
import { parseGeozoneRulesJson } from "@/features/geozones/lib/parse-geozone-rules-json";
import {
  GEOZONE_TYPES_ORDERED,
  geozoneTypeLangKey,
} from "@/features/geozones/lib/geozone-type-present";
import { loadGeozonesCatalog } from "@/features/geozones/model/geozones-state";
import { tariffsApi } from "@/features/tariffs/api";
import { HttpApiError } from "@/shared/api/http-api-error";
import { getYandexMapsApiKey } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";
import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

const apiKey = getYandexMapsApiKey();

function formatTariffAmount(n: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function normalizeColorHex(raw: string): string {
  const t = raw.trim();
  const withHash = t.startsWith("#") ? t : `#${t}`;
  return withHash.slice(0, 32);
}

type InitialMeta = {
  name: string;
  type: GeozoneType;
  color: string;
};

type VersionFingerprint = {
  ringJson: string;
  tariffPresetId: string | null;
  rulesJson: string;
};

const GeozoneEditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadCatalog = useAction(loadGeozonesCatalog);

  const params = useParams({ strict: false }) as { geozoneId?: string };
  const geozoneId = params.geozoneId ?? "";

  const initialMetaRef = useRef<InitialMeta | null>(null);
  const initialVersionRef = useRef<VersionFingerprint | null>(null);

  const [loadPhase, setLoadPhase] = useState<"loading" | "ok" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [drawMode, setDrawMode] = useState<GeozoneDrawMode>("rectangle");
  const [polygonVertices, setPolygonVertices] = useState<YMapLngLat[]>([]);
  const [rectangleAnchor, setRectangleAnchor] = useState<YMapLngLat | null>(
    null,
  );
  const [closedRing, setClosedRing] = useState<YMapLngLat[] | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<GeozoneType>(GeozoneType.RENTAL);
  const [color, setColor] = useState("#228be6");
  const [rulesJson, setRulesJson] = useState("");

  const [tariffPresets, setTariffPresets] = useState<TariffRead[]>([]);
  const [tariffPresetId, setTariffPresetId] = useState<string | null>(null);
  const userChangedPresetRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const typeSelectData = useMemo(() => {
    return GEOZONE_TYPES_ORDERED.map((gt) => ({
      value: gt,
      label: t(geozoneTypeLangKey(gt)),
    }));
  }, [t]);

  const tariffPresetSelectData = useMemo(() => {
    const fromApi = tariffPresets.map((p) => ({
      value: p.id,
      label: p.name,
    }));
    if (
      tariffPresetId !== null &&
      tariffPresetId !== "" &&
      !fromApi.some((o) => o.value === tariffPresetId)
    ) {
      return [{ value: tariffPresetId, label: tariffPresetId }, ...fromApi];
    }
    return fromApi;
  }, [tariffPresetId, tariffPresets]);

  const selectedTariffPreset = useMemo(() => {
    return tariffPresets.find((p) => p.id === tariffPresetId) ?? null;
  }, [tariffPresets, tariffPresetId]);

  useEffect(() => {
    let cancelled = false;
    void tariffsApi
      .findAll({ includeDeleted: false })
      .then((list) => {
        if (!cancelled) {
          setTariffPresets(list.filter((x) => !x.isDeleted));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTariffPresets([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadPhase !== "ok") {
      return;
    }
    if (userChangedPresetRef.current) {
      return;
    }
    if (tariffPresetId !== null) {
      return;
    }
    const id = pickDefaultTariffPresetId(tariffPresets);
    if (id) {
      setTariffPresetId(id);
    }
  }, [loadPhase, tariffPresetId, tariffPresets]);

  useEffect(() => {
    if (!geozoneId) {
      setLoadPhase("error");
      setLoadError(t(LANG_KEYS.pages.geozonesEditNotFound));
      return;
    }

    let cancelled = false;
    setLoadPhase("loading");
    setLoadError(null);
    userChangedPresetRef.current = false;

    void (async () => {
      try {
        const zone = await geozonesApi.findById(geozoneId);
        let version = null;
        if (zone.currentVersionId) {
          version = await geozonesApi.findVersionById(
            geozoneId,
            zone.currentVersionId,
          );
        }

        if (cancelled) {
          return;
        }

        const meta: InitialMeta = {
          name: zone.name,
          type: zone.type,
          color: normalizeColorHex(zone.color),
        };
        initialMetaRef.current = meta;

        setName(meta.name);
        setType(meta.type);
        setColor(meta.color);

        const ring =
          version !== null
            ? multiPolygonFirstOuterRing(version.geometry)
            : null;
        setClosedRing(ring);

        const presetId = version?.tariffPresetId ?? null;
        setTariffPresetId(presetId);

        const rulesText =
          version?.rules != null ? JSON.stringify(version.rules, null, 2) : "";
        setRulesJson(rulesText);

        initialVersionRef.current = {
          ringJson: ring ? JSON.stringify(ring) : "",
          tariffPresetId: presetId,
          rulesJson: JSON.stringify(version?.rules ?? null),
        };

        setPolygonVertices([]);
        setRectangleAnchor(null);
        setLoadPhase("ok");
      } catch (e) {
        if (cancelled) {
          return;
        }
        const msg =
          e instanceof HttpApiError && e.status === 404
            ? t(LANG_KEYS.pages.geozonesEditNotFound)
            : e instanceof Error
              ? e.message
              : t(LANG_KEYS.pages.geozonesEditLoadFailed);
        setLoadError(msg);
        setLoadPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [geozoneId, t]);

  const handleDrawModeChange = useCallback((mode: GeozoneDrawMode) => {
    setDrawMode(mode);
    setPolygonVertices([]);
    setRectangleAnchor(null);
  }, []);

  const clearGeometry = useCallback(() => {
    setPolygonVertices([]);
    setRectangleAnchor(null);
    setClosedRing(null);
  }, []);

  const handleMapClick = useCallback(
    (ll: YMapLngLat) => {
      if (closedRing) {
        return;
      }
      if (drawMode === "rectangle") {
        if (!rectangleAnchor) {
          setRectangleAnchor(ll);
          return;
        }
        setClosedRing(rectangleFromDiagonal(rectangleAnchor, ll));
        setRectangleAnchor(null);
        return;
      }
      setPolygonVertices((v) => [...v, ll]);
    },
    [closedRing, drawMode, rectangleAnchor],
  );

  const completePolygon = useCallback(() => {
    if (polygonVertices.length < 3) {
      setFormError(t(LANG_KEYS.pages.geozonesCreatePolygonTooFewPoints));
      return;
    }
    setFormError(null);
    setClosedRing(ensureClosedRing(polygonVertices));
    setPolygonVertices([]);
  }, [polygonVertices, t]);

  const undoVertex = useCallback(() => {
    setPolygonVertices((v) => v.slice(0, -1));
  }, []);

  const drawModeData = useMemo(
    () => [
      {
        value: "rectangle",
        label: t(LANG_KEYS.pages.geozonesCreateDrawModeRectangle),
      },
      {
        value: "polygon",
        label: t(LANG_KEYS.pages.geozonesCreateDrawModePolygon),
      },
    ],
    [t],
  );

  const computeDirty = useCallback(() => {
    const im = initialMetaRef.current;
    const iv = initialVersionRef.current;
    const colorNorm = normalizeColorHex(color);

    let metaDirty = false;
    if (im) {
      metaDirty =
        name.trim() !== im.name || type !== im.type || colorNorm !== im.color;
    }

    let versionDirty = false;
    if (iv) {
      const ringJson =
        closedRing && isValidClosedRing(closedRing)
          ? JSON.stringify(closedRing)
          : "";
      const rulesParsed = parseGeozoneRulesJson(rulesJson);
      const rulesNorm = rulesParsed.ok
        ? JSON.stringify(rulesParsed.value ?? null)
        : "__invalid__";

      const presetCur = tariffPresetId ?? null;
      const presetIv = iv.tariffPresetId ?? null;

      versionDirty =
        ringJson !== iv.ringJson ||
        presetCur !== presetIv ||
        rulesNorm !== iv.rulesJson;
    }

    return { metaDirty, versionDirty };
  }, [closedRing, color, name, rulesJson, tariffPresetId, type]);

  const handleSave = async () => {
    setFormError(null);

    if (!geozoneId || loadPhase !== "ok") {
      return;
    }

    const { metaDirty, versionDirty } = computeDirty();

    if (!metaDirty && !versionDirty) {
      notifications.show({
        message: t(LANG_KEYS.pages.geozonesEditNothingToSave),
        color: "blue",
      });
      return;
    }

    const im = initialMetaRef.current;

    if (
      versionDirty &&
      (!tariffPresetId || !String(tariffPresetId).trim())
    ) {
      setFormError(t(LANG_KEYS.pages.geozonesEditTariffPresetRequired));
      return;
    }

    if (versionDirty) {
      const rulesParsed = parseGeozoneRulesJson(rulesJson);
      if (!rulesParsed.ok) {
        setFormError(t(LANG_KEYS.pages.geozonesCreateRulesInvalidJson));
        return;
      }
      if (!closedRing || !isValidClosedRing(closedRing)) {
        setFormError(t(LANG_KEYS.pages.geozonesCreateGeometryRequired));
        return;
      }
    }

    setSubmitting(true);
    try {
      if (metaDirty && im) {
        const patch: GeozoneUpdateBody = {};
        if (name.trim() !== im.name) {
          patch.name = name.trim();
        }
        if (type !== im.type) {
          patch.type = type;
        }
        const colorNorm = normalizeColorHex(color);
        if (colorNorm !== im.color) {
          patch.color = colorNorm;
        }
        if (Object.keys(patch).length > 0) {
          await geozonesApi.update(geozoneId, patch);
        }
      }

      if (versionDirty) {
        const rulesParsed = parseGeozoneRulesJson(rulesJson);
        if (!rulesParsed.ok || !closedRing) {
          return;
        }
        const pub: GeozoneVersionCreateBody = {
          geometry: ringToMultiPolygon(closedRing),
          rules: rulesParsed.value ?? null,
          tariffPresetId: tariffPresetId!.trim(),
        };
        await geozonesApi.publishVersion(geozoneId, pub);
      }

      notifications.show({
        title: t(LANG_KEYS.pages.geozonesEditSuccess),
        message: name.trim(),
        color: "green",
      });
      void reloadCatalog();
      void navigate({ to: ROUTES.dashboard.geozones });
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

  if (loadPhase === "loading") {
    return (
      <Container size="xl" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader />
            <Text c="dimmed">{t(LANG_KEYS.pages.geozonesEditLoading)}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (loadPhase === "error") {
    return (
      <Container size="lg" py="md" px="md">
        <Stack gap="md">
          <Title order={2}>{t(LANG_KEYS.pages.geozonesEditorEditTitle)}</Title>
          <Alert color="red">{loadError}</Alert>
          <Link
            to={ROUTES.dashboard.geozones}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="light">
              {t(LANG_KEYS.pages.geozonesCreateCancel)}
            </Button>
          </Link>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>
              {t(LANG_KEYS.pages.geozonesEditorEditTitle)}
            </Title>
            <Text size="sm" ff="monospace" c="dimmed">
              {geozoneId}
            </Text>
          </Stack>
          <Link
            to={ROUTES.dashboard.geozones}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.geozonesCreateCancel)}
            </Button>
          </Link>
        </Group>

        <Alert color="gray" variant="light">
          {t(LANG_KEYS.pages.geozonesEditHintVersioning)}
        </Alert>

        {!apiKey.trim() ? (
          <Alert color="yellow" title={t(LANG_KEYS.map.noApiKeyTitle)}>
            {t(LANG_KEYS.map.noApiKeyBody)}
          </Alert>
        ) : null}

        {formError ? (
          <Alert color="red" onClose={() => setFormError(null)} withCloseButton>
            {formError}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Stack gap="md">
            <Title order={4}>
              {t(LANG_KEYS.pages.geozonesCreateSectionForm)}
            </Title>
            <TextInput
              label={t(LANG_KEYS.pages.geozonesCreateFieldName)}
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
            />
            <Select
              label={t(LANG_KEYS.pages.geozonesCreateFieldType)}
              data={typeSelectData}
              value={type}
              onChange={(v) => {
                if (v) {
                  setType(v as GeozoneType);
                }
              }}
            />
            <ColorInput
              label={t(LANG_KEYS.pages.geozonesCreateFieldColor)}
              value={color}
              onChange={setColor}
              format="hex"
              swatches={["#228be6", "#40c057", "#fab005", "#fa5252", "#be4bdb"]}
            />
            <Select
              label={t(LANG_KEYS.pages.geozonesCreateFieldTariffPreset)}
              data={tariffPresetSelectData}
              value={tariffPresetId ?? ""}
              onChange={(v) => {
                userChangedPresetRef.current = true;
                setTariffPresetId(v && v !== "" ? v : null);
              }}
              disabled={tariffPresetSelectData.length === 0}
            />
            <Alert color="gray" variant="light">
              {t(LANG_KEYS.pages.geozonesCreateTariffPresetHint)}
            </Alert>
            {selectedTariffPreset ? (
              <Stack gap={6}>
                <Text size="sm">
                  <Text span c="dimmed">
                    {t(LANG_KEYS.pages.geozonesCreateFieldPricePerMinute)}
                  </Text>{" "}
                  <Text span fw={500}>
                    {formatTariffAmount(selectedTariffPreset.pricePerMinute)}
                  </Text>
                </Text>
                <Text size="sm">
                  <Text span c="dimmed">
                    {t(LANG_KEYS.pages.geozonesCreateFieldPricePerKm)}
                  </Text>{" "}
                  <Text span fw={500}>
                    {formatTariffAmount(selectedTariffPreset.pricePerKm)}
                  </Text>
                </Text>
                <Text size="sm">
                  <Text span c="dimmed">
                    {t(LANG_KEYS.pages.geozonesCreateFieldPausePricePerMinute)}
                  </Text>{" "}
                  <Text span fw={500}>
                    {formatTariffAmount(
                      selectedTariffPreset.pausePricePerMinute,
                    )}
                  </Text>
                </Text>
              </Stack>
            ) : null}
            <Textarea
              label={t(LANG_KEYS.pages.geozonesCreateRulesOptional)}
              placeholder={t(LANG_KEYS.pages.geozonesCreateRulesPlaceholder)}
              value={rulesJson}
              onChange={(e) => setRulesJson(e.currentTarget.value)}
              autosize
              minRows={2}
            />
            <Button onClick={() => void handleSave()} loading={submitting}>
              {t(LANG_KEYS.pages.geozonesEditSave)}
            </Button>
          </Stack>

          <Stack gap="md">
            <Title order={4}>
              {t(LANG_KEYS.pages.geozonesCreateSectionMap)}
            </Title>
            <SegmentedControl
              value={drawMode}
              onChange={(v) => handleDrawModeChange(v as GeozoneDrawMode)}
              data={drawModeData}
              fullWidth
            />
            <Text size="sm" c="dimmed">
              {drawMode === "rectangle"
                ? t(LANG_KEYS.pages.geozonesCreateDrawHintRectangle)
                : t(LANG_KEYS.pages.geozonesCreateDrawHintPolygon)}
            </Text>
            <Group gap="xs" wrap="wrap">
              <Button variant="light" onClick={clearGeometry}>
                {t(LANG_KEYS.pages.geozonesCreateClearGeometry)}
              </Button>
              {drawMode === "polygon" ? (
                <>
                  <Button
                    variant="light"
                    onClick={undoVertex}
                    disabled={polygonVertices.length === 0 || !!closedRing}
                  >
                    {t(LANG_KEYS.pages.geozonesCreateUndoVertex)}
                  </Button>
                  <Button
                    variant="light"
                    onClick={completePolygon}
                    disabled={!!closedRing || polygonVertices.length < 3}
                  >
                    {t(LANG_KEYS.pages.geozonesCreateClosePolygon)}
                  </Button>
                </>
              ) : null}
            </Group>
            {apiKey.trim() ? (
              <GeozoneDrawMap
                apiKey={apiKey}
                previewColorHex={color}
                drawMode={drawMode}
                polygonVertices={polygonVertices}
                closedRing={closedRing}
                rectangleAnchor={rectangleAnchor}
                onLngLatClick={handleMapClick}
                height="min(55dvh, 520px)"
              />
            ) : (
              <Text size="sm" c="dimmed">
                {t(LANG_KEYS.map.noApiKeyTitle)}
              </Text>
            )}
          </Stack>
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
GeozoneEditPage.displayName = "GeozoneEditPage";

export { GeozoneEditPage };
