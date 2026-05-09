import { useEffect, useRef, useState } from 'react'

import { Center, Loader, Stack, Text } from '@mantine/core'

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from '@/shared/config/map-defaults'
import { LANG_KEYS } from '@/shared/i18n/keys'
import { translate } from '@/shared/i18n/translate'
import {
  attachOverlayMarkers,
  yandexMapsRenderService,
} from '@/shared/lib/yandex-maps/yandex-maps-render-service'
import type { YandexMapOverlayMarker } from '@/shared/lib/yandex-maps/yandex-maps-render-service'
import type { YMapLngLat, YMaps3MapInstance } from '@/shared/lib/yandex-maps/ymaps3'

export type YandexMapCanvasProps = {
  apiKey: string
  /** Долгота и широта (API 3.0). */
  center?: YMapLngLat
  zoom?: number
  /** Высота блока (число = px). Для полноэкранной карты задайте `"100%"` и выдайте родителю высоту. */
  height?: number | string
  /** Пример DOM-маркеров (чипы на карте). */
  overlayMarkers?: YandexMapOverlayMarker[]
}

/**
 * Низкоуровневый блок: контейнер + загрузка API и монтаж карты через {@link yandexMapsRenderService}.
 * Схема и маркеры разделены: смена маркеров не пересоздаёт карту (нет гонок при подгрузке машин).
 */
const YandexMapCanvas = ({
  apiKey,
  center,
  zoom,
  height = 420,
  overlayMarkers,
}: YandexMapCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<YMaps3MapInstance | null>(null)
  const mapDestroyRef = useRef<(() => void) | null>(null)
  const detachMarkersRef = useRef<(() => void) | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const centerLng = center?.[0]
  const centerLat = center?.[1]
  const markersKey = JSON.stringify(overlayMarkers ?? [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !apiKey.trim()) {
      mapInstanceRef.current = null
      setMapReady(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setMapReady(false)
    setLoading(true)
    setError(null)

    detachMarkersRef.current?.()
    detachMarkersRef.current = null
    mapDestroyRef.current?.()
    mapDestroyRef.current = null
    mapInstanceRef.current = null

    void (async () => {
      try {
        const resolvedCenter: YMapLngLat =
          centerLng !== undefined && centerLat !== undefined
            ? [centerLng, centerLat]
            : DEFAULT_MAP_CENTER

        const handle = await yandexMapsRenderService.mountSchemeMapOnlyAsync(apiKey, el, {
          center: resolvedCenter,
          zoom: zoom ?? DEFAULT_MAP_ZOOM,
        })

        if (cancelled) {
          handle.destroy()
          return
        }

        mapInstanceRef.current = handle.map
        mapDestroyRef.current = handle.destroy
        setMapReady(true)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : translate(LANG_KEYS.map.canvasLoadFailed),
          )
        }
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      setMapReady(false)
      detachMarkersRef.current?.()
      detachMarkersRef.current = null
      mapDestroyRef.current?.()
      mapDestroyRef.current = null
      mapInstanceRef.current = null
    }
  }, [apiKey, centerLng, centerLat, zoom])

  useEffect(() => {
    if (!mapReady) {
      return
    }

    const map = mapInstanceRef.current
    if (!map) {
      return
    }

    detachMarkersRef.current?.()
    detachMarkersRef.current = attachOverlayMarkers(map, overlayMarkers)

    return () => {
      detachMarkersRef.current?.()
      detachMarkersRef.current = null
    }
  }, [mapReady, markersKey])

  const h = typeof height === 'number' ? `${height}px` : height

  return (
    <Stack gap={0} style={{ position: 'relative', width: '100%', height: h }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {loading ? (
        <Center
          pos="absolute"
          inset={0}
          bg="var(--mantine-color-body)"
          style={{ opacity: 0.85, pointerEvents: 'none' }}
        >
          <Loader size="md" />
        </Center>
      ) : null}

      {error ? (
        <Center pos="absolute" inset={0} p="md" bg="var(--mantine-color-body)">
          <Text size="sm" c="dimmed" ta="center">
            {error}
          </Text>
        </Center>
      ) : null}
    </Stack>
  )
}
YandexMapCanvas.displayName = 'YandexMapCanvas'

export { YandexMapCanvas }
