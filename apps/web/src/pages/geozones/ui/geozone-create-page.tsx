import {
  Alert,
  Button,
  ColorInput,
  Container,
  Group,
  NumberInput,
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
import { useAction, useAtom } from "@reatom/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GeozoneCreateBody } from "@/entities/geozone";
import { GeozoneType } from "@/entities/geozone";
import { authUserAtom } from "@/features/auth/model/session";
import { geozonesApi } from "@/features/geozones/api";
import type { GeozoneDrawMode } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import { GeozoneDrawMap } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import {
  ensureClosedRing,
  isValidClosedRing,
  rectangleFromDiagonal,
  ringToMultiPolygon,
} from "@/features/geozones/lib/geojson-ring";
import {
  GEOZONE_TYPES_ORDERED,
  geozoneTypeLangKey,
} from "@/features/geozones/lib/geozone-type-present";
import { parseGeozoneRulesJson } from "@/features/geozones/lib/parse-geozone-rules-json";
import { loadGeozonesCatalog } from "@/features/geozones/model/geozones-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { getYandexMapsApiKey } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";
import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

const apiKey = getYandexMapsApiKey();

const GeozoneCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user] = useAtom(authUserAtom);
  const reloadCatalog = useAction(loadGeozonesCatalog);

  const [drawMode, setDrawMode] = useState<GeozoneDrawMode>("rectangle");
  const [polygonVertices, setPolygonVertices] = useState<YMapLngLat[]>([]);
  const [rectangleAnchor, setRectangleAnchor] = useState<YMapLngLat | null>(
    null,
  );
  const [closedRing, setClosedRing] = useState<YMapLngLat[] | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<GeozoneType>(GeozoneType.RENTAL);
  const [color, setColor] = useState("#228be6");
  const [pricePerMinute, setPricePerMinute] = useState<number | string>(0);
  const [pricePerKm, setPricePerKm] = useState<number | string>(0);
  const [pausePricePerMinute, setPausePricePerMinute] = useState<
    number | string
  >(0);
  const [rulesJson, setRulesJson] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const typeSelectData = useMemo(() => {
    return GEOZONE_TYPES_ORDERED.map((gt) => ({
      value: gt,
      label: t(geozoneTypeLangKey(gt)),
    }));
  }, [t]);

  useEffect(() => {
    setPolygonVertices([]);
    setRectangleAnchor(null);
    setClosedRing(null);
  }, [drawMode]);

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

  const handleSubmit = async () => {
    setFormError(null);

    if (!user?.id?.trim()) {
      setFormError(t(LANG_KEYS.pages.geozonesCreateAuthRequired));
      return;
    }

    if (!name.trim()) {
      setFormError(t(LANG_KEYS.pages.geozonesCreateNameRequired));
      return;
    }

    if (!closedRing || !isValidClosedRing(closedRing)) {
      setFormError(t(LANG_KEYS.pages.geozonesCreateGeometryRequired));
      return;
    }

    const rulesParsed = parseGeozoneRulesJson(rulesJson);
    if (!rulesParsed.ok) {
      setFormError(t(LANG_KEYS.pages.geozonesCreateRulesInvalidJson));
      return;
    }

    const pm = Number(pricePerMinute);
    const pk = Number(pricePerKm);
    const pp = Number(pausePricePerMinute);
    if (
      Number.isNaN(pm) ||
      Number.isNaN(pk) ||
      Number.isNaN(pp) ||
      pm < 0 ||
      pk < 0 ||
      pp < 0
    ) {
      setFormError(t(LANG_KEYS.pages.geozonesCreatePricesInvalid));
      return;
    }

    let colorStr = color.trim();
    if (!colorStr.startsWith("#")) {
      colorStr = `#${colorStr}`;
    }

    const body: GeozoneCreateBody = {
      name: name.trim(),
      type,
      color: colorStr.slice(0, 32),
      geometry: ringToMultiPolygon(closedRing),
      pricePerMinute: pm,
      pricePerKm: pk,
      pausePricePerMinute: pp,
      createdByUserId: user.id,
    };

    if (rulesParsed.value !== null) {
      body.rules = rulesParsed.value;
    }

    setSubmitting(true);
    try {
      await geozonesApi.create(body);
      notifications.show({
        title: t(LANG_KEYS.pages.geozonesCreateSuccessTitle),
        message: body.name,
        color: "green",
      });
      void reloadCatalog(false);
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

  return (
    <Container size="xl" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Title order={2}>{t(LANG_KEYS.pages.geozonesEditorNewTitle)}</Title>
          <Link
            to={ROUTES.dashboard.geozones}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.geozonesCreateCancel)}
            </Button>
          </Link>
        </Group>

        {!user?.id ? (
          <Alert color="yellow">
            {t(LANG_KEYS.pages.geozonesCreateAuthRequired)}
          </Alert>
        ) : null}

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
            <Title order={4}>{t(LANG_KEYS.pages.geozonesCreateSectionForm)}</Title>
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
              swatches={[
                "#228be6",
                "#40c057",
                "#fab005",
                "#fa5252",
                "#be4bdb",
              ]}
            />
            <NumberInput
              label={t(LANG_KEYS.pages.geozonesCreateFieldPricePerMinute)}
              value={pricePerMinute}
              onChange={setPricePerMinute}
              min={0}
              decimalScale={2}
              fixedDecimalScale
            />
            <NumberInput
              label={t(LANG_KEYS.pages.geozonesCreateFieldPricePerKm)}
              value={pricePerKm}
              onChange={setPricePerKm}
              min={0}
              decimalScale={2}
              fixedDecimalScale
            />
            <NumberInput
              label={t(
                LANG_KEYS.pages.geozonesCreateFieldPausePricePerMinute,
              )}
              value={pausePricePerMinute}
              onChange={setPausePricePerMinute}
              min={0}
              decimalScale={2}
              fixedDecimalScale
            />
            <Textarea
              label={t(LANG_KEYS.pages.geozonesCreateRulesOptional)}
              placeholder={t(LANG_KEYS.pages.geozonesCreateRulesPlaceholder)}
              value={rulesJson}
              onChange={(e) => setRulesJson(e.currentTarget.value)}
              autosize
              minRows={2}
            />
            <Button
              onClick={() => void handleSubmit()}
              loading={submitting}
              disabled={!user?.id}
            >
              {t(LANG_KEYS.pages.geozonesCreateSubmit)}
            </Button>
          </Stack>

          <Stack gap="md">
            <Title order={4}>{t(LANG_KEYS.pages.geozonesCreateSectionMap)}</Title>
            <SegmentedControl
              value={drawMode}
              onChange={(v) => setDrawMode(v as GeozoneDrawMode)}
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
GeozoneCreatePage.displayName = "GeozoneCreatePage";

export { GeozoneCreatePage };
