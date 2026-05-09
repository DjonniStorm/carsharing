import { Alert, Box, Group, Paper, Stack, Text } from '@mantine/core'
import { useAction, useAtom } from '@reatom/react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { carToMapMarker } from '@/entities/car'
import { carsListAtom, carsListErrorAtom, loadCarsList } from '@/features/cars/model/cars-list'
import {
  dashboardGeozonesErrorAtom,
  loadDashboardGeozonesForBBox,
} from '@/features/geozones/model/geozones-state'
import { getYandexMapsApiKey } from '@/shared/config/env'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_GEOZONE_BOUNDS,
  DEFAULT_MAP_ZOOM,
} from '@/shared/config/map-defaults'
import { LANG_KEYS } from '@/shared/i18n/keys'

import { YandexMapPlain } from '@/widgets/yandex-map'

/** Как `header={{ height: 56 }}` у {@link DashboardShell}. */
const APP_SHELL_HEADER_PX = 56

const apiKey = getYandexMapsApiKey()

const LegendRow = ({ color, label }: { color: string; label: string }) => {
  return (
    <Group gap={8} wrap="nowrap">
      <Box
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          flexShrink: 0,
        }}
      />
      <Text size="sm">{label}</Text>
    </Group>
  )
}
LegendRow.displayName = 'LegendRow'

const DashboardPage = () => {
  const { t } = useTranslation()
  const [cars] = useAtom(carsListAtom)
  const [carsError] = useAtom(carsListErrorAtom)
  const [geozonesError] = useAtom(dashboardGeozonesErrorAtom)

  const loadCars = useAction(loadCarsList)
  const loadGeozonesBBox = useAction(loadDashboardGeozonesForBBox)

  useEffect(() => {
    void loadCars(false)
    void loadGeozonesBBox({ ...DEFAULT_MAP_GEOZONE_BOUNDS })
  }, [loadCars, loadGeozonesBBox])

  const overlayMarkers = useMemo(() => {
    if (!cars?.length) {
      return undefined
    }
    return cars
      .map(carToMapMarker)
      .filter((m): m is NonNullable<typeof m> => m !== null)
  }, [cars])

  return (
    <Box
      style={{
        width: '100%',
        height: `calc(100dvh - ${APP_SHELL_HEADER_PX}px)`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!apiKey.trim() ? (
        <Alert m="md" color="yellow" title={t(LANG_KEYS.map.noApiKeyTitle)}>
          {t(LANG_KEYS.map.noApiKeyBody)}
        </Alert>
      ) : (
        <>
          {carsError ? (
            <Alert m="md" color="red" title={t(LANG_KEYS.pages.carsTitle)}>
              {carsError}
            </Alert>
          ) : null}
          {geozonesError ? (
            <Alert m="md" color="orange">
              {geozonesError}
            </Alert>
          ) : null}
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
              width: '100%',
            }}
          >
            <YandexMapPlain
              apiKey={apiKey}
              center={DEFAULT_MAP_CENTER}
              zoom={DEFAULT_MAP_ZOOM}
              height="100%"
              overlayMarkers={overlayMarkers}
            />
            <Paper
              shadow="md"
              p="sm"
              radius="md"
              withBorder
              style={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                maxWidth: 240,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                {t(LANG_KEYS.map.legendTitle)}
              </Text>
              <Stack gap={6}>
                <LegendRow color="#22c55e" label={t(LANG_KEYS.map.legendAvailable)} />
                <LegendRow color="#228be6" label={t(LANG_KEYS.map.legendInUse)} />
                <LegendRow color="#adb5bd" label={t(LANG_KEYS.map.legendOffline)} />
              </Stack>
            </Paper>
          </Box>
        </>
      )}
    </Box>
  )
}
DashboardPage.displayName = 'DashboardPage'

export { DashboardPage }
