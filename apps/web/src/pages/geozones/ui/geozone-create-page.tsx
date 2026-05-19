import {
  Alert,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useGeozoneFormFields } from "@/features/geozones/hooks/use-geozone-form-fields";
import { useGeozoneMapDraw } from "@/features/geozones/hooks/use-geozone-map-draw";
import { useGeozoneTariffPresets } from "@/features/geozones/hooks/use-geozone-tariff-presets";
import {
  buildGeozoneDrawModeSelectData,
  buildGeozoneTypeSelectData,
} from "@/features/geozones/lib/geozone-form-present";
import { getYandexMapsApiKey } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useGeozoneCreateSubmit } from "@/pages/geozones/hooks/use-geozone-create-submit";
import { GeozoneEditForm } from "@/pages/geozones/ui/geozone-edit-form";
import { GeozoneEditMapSection } from "@/pages/geozones/ui/geozone-edit-map-section";

const apiKey = getYandexMapsApiKey();

const GeozoneCreatePage = () => {
  const { t } = useTranslation();
  const form = useGeozoneFormFields();
  const map = useGeozoneMapDraw({ resetGeometryOnDrawModeChange: true });
  const tariffs = useGeozoneTariffPresets();
  const submit = useGeozoneCreateSubmit({ form, map, tariffs });

  const typeSelectData = buildGeozoneTypeSelectData(t);
  const drawModeData = buildGeozoneDrawModeSelectData(t);

  const completePolygon = () => {
    map.completePolygon({
      onValidationError: () => {
        submit.setFormError(
          t(LANG_KEYS.pages.geozonesCreatePolygonTooFewPoints),
        );
      },
      onSuccess: () => {
        submit.setFormError(null);
      },
    });
  };

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

        {!submit.user?.id ? (
          <Alert color="yellow">
            {t(LANG_KEYS.pages.geozonesCreateAuthRequired)}
          </Alert>
        ) : null}

        {!apiKey.trim() ? (
          <Alert color="yellow" title={t(LANG_KEYS.map.noApiKeyTitle)}>
            {t(LANG_KEYS.map.noApiKeyBody)}
          </Alert>
        ) : null}

        {submit.formError ? (
          <Alert
            color="red"
            onClose={() => submit.setFormError(null)}
            withCloseButton
          >
            {submit.formError}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <GeozoneEditForm
            name={form.name}
            onNameChange={form.setName}
            type={form.type}
            onTypeChange={form.setType}
            typeSelectData={typeSelectData}
            color={form.color}
            onColorChange={form.setColor}
            tariffPresetSelectData={tariffs.tariffPresetSelectData}
            tariffPresetId={tariffs.tariffPresetId}
            onTariffPresetChange={tariffs.onTariffPresetChange}
            selectedTariffPreset={tariffs.selectedTariffPreset}
            rulesJson={form.rulesJson}
            onRulesJsonChange={form.setRulesJson}
            submitting={submit.submitting}
            submitDisabled={!submit.user?.id}
            saveLabel={t(LANG_KEYS.pages.geozonesCreateSubmit)}
            onSave={() => void submit.handleSubmit()}
          />
          <GeozoneEditMapSection
            apiKey={apiKey}
            previewColorHex={form.color}
            drawMode={map.drawMode}
            drawModeData={drawModeData}
            onDrawModeChange={map.handleDrawModeChange}
            polygonVertices={map.polygonVertices}
            closedRing={map.closedRing}
            rectangleAnchor={map.rectangleAnchor}
            onLngLatClick={map.handleMapClick}
            onClearGeometry={map.clearGeometry}
            onUndoVertex={map.undoVertex}
            onCompletePolygon={completePolygon}
          />
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
GeozoneCreatePage.displayName = "GeozoneCreatePage";

export { GeozoneCreatePage };
