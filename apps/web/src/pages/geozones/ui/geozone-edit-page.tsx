import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getYandexMapsApiKey } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

import {
  buildGeozoneDrawModeSelectData,
  buildGeozoneTypeSelectData,
} from "@/features/geozones/lib/geozone-form-present";

import { useGeozoneEditPage } from "@/pages/geozones/hooks/use-geozone-edit-page";
import { GeozoneEditForm } from "@/pages/geozones/ui/geozone-edit-form";
import { GeozoneEditMapSection } from "@/pages/geozones/ui/geozone-edit-map-section";

const apiKey = getYandexMapsApiKey();

const GeozoneEditPage = () => {
  const { t } = useTranslation();
  const vm = useGeozoneEditPage();
  const typeSelectData = buildGeozoneTypeSelectData(t);
  const drawModeData = buildGeozoneDrawModeSelectData(t);

  if (vm.loadPhase === "loading") {
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

  if (vm.loadPhase === "error") {
    return (
      <Container size="lg" py="md" px="md">
        <Stack gap="md">
          <Title order={2}>{t(LANG_KEYS.pages.geozonesEditorEditTitle)}</Title>
          <Alert color="red">{vm.loadError}</Alert>
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
              {vm.geozoneId}
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

        {vm.formError ? (
          <Alert
            color="red"
            onClose={() => vm.setFormError(null)}
            withCloseButton
          >
            {vm.formError}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <GeozoneEditForm
            name={vm.name}
            onNameChange={vm.setName}
            type={vm.type}
            onTypeChange={vm.setType}
            typeSelectData={typeSelectData}
            color={vm.color}
            onColorChange={vm.setColor}
            tariffPresetSelectData={vm.tariffPresetSelectData}
            tariffPresetId={vm.tariffPresetId}
            onTariffPresetChange={vm.onTariffPresetChange}
            selectedTariffPreset={vm.selectedTariffPreset}
            submitting={vm.submitting}
            onSave={() => void vm.handleSave()}
          />
          <GeozoneEditMapSection
            apiKey={apiKey}
            previewColorHex={vm.color}
            drawMode={vm.drawMode}
            drawModeData={drawModeData}
            onDrawModeChange={vm.handleDrawModeChange}
            polygonVertices={vm.polygonVertices}
            closedRing={vm.closedRing}
            rectangleAnchor={vm.rectangleAnchor}
            onLngLatClick={vm.handleMapClick}
            onClearGeometry={vm.clearGeometry}
            onUndoVertex={vm.undoVertex}
            onCompletePolygon={vm.completePolygon}
          />
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
GeozoneEditPage.displayName = "GeozoneEditPage";

export { GeozoneEditPage };
