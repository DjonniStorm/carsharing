import { Button, Group, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { GeozoneDrawMode } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import { GeozoneDrawMap } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import { LANG_KEYS } from "@/shared/i18n/keys";
import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

type Props = {
  apiKey: string;
  previewColorHex: string;
  drawMode: GeozoneDrawMode;
  drawModeData: { value: string; label: string }[];
  onDrawModeChange: (mode: GeozoneDrawMode) => void;
  polygonVertices: YMapLngLat[];
  closedRing: YMapLngLat[] | null;
  rectangleAnchor: YMapLngLat | null;
  onLngLatClick: (ll: YMapLngLat) => void;
  onClearGeometry: () => void;
  onUndoVertex: () => void;
  onCompletePolygon: () => void;
};

export function GeozoneEditMapSection({
  apiKey,
  previewColorHex,
  drawMode,
  drawModeData,
  onDrawModeChange,
  polygonVertices,
  closedRing,
  rectangleAnchor,
  onLngLatClick,
  onClearGeometry,
  onUndoVertex,
  onCompletePolygon,
}: Props) {
  const { t } = useTranslation();
  const hasApiKey = apiKey.trim().length > 0;

  return (
    <Stack gap="md">
      <Title order={4}>{t(LANG_KEYS.pages.geozonesCreateSectionMap)}</Title>
      <SegmentedControl
        value={drawMode}
        onChange={(v) => onDrawModeChange(v as GeozoneDrawMode)}
        data={drawModeData}
        fullWidth
      />
      <Text size="sm" c="dimmed">
        {drawMode === "rectangle"
          ? t(LANG_KEYS.pages.geozonesCreateDrawHintRectangle)
          : t(LANG_KEYS.pages.geozonesCreateDrawHintPolygon)}
      </Text>
      <Group gap="xs" wrap="wrap">
        <Button variant="light" onClick={onClearGeometry}>
          {t(LANG_KEYS.pages.geozonesCreateClearGeometry)}
        </Button>
        {drawMode === "polygon" ? (
          <>
            <Button
              variant="light"
              onClick={onUndoVertex}
              disabled={polygonVertices.length === 0 || !!closedRing}
            >
              {t(LANG_KEYS.pages.geozonesCreateUndoVertex)}
            </Button>
            <Button
              variant="light"
              onClick={onCompletePolygon}
              disabled={!!closedRing || polygonVertices.length < 3}
            >
              {t(LANG_KEYS.pages.geozonesCreateClosePolygon)}
            </Button>
          </>
        ) : null}
      </Group>
      {hasApiKey ? (
        <GeozoneDrawMap
          apiKey={apiKey}
          previewColorHex={previewColorHex}
          drawMode={drawMode}
          polygonVertices={polygonVertices}
          closedRing={closedRing}
          rectangleAnchor={rectangleAnchor}
          onLngLatClick={onLngLatClick}
          height="min(55dvh, 520px)"
        />
      ) : (
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.map.noApiKeyTitle)}
        </Text>
      )}
    </Stack>
  );
}
