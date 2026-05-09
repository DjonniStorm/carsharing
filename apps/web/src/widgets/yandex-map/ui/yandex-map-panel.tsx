import { Paper, Stack, Text } from '@mantine/core'

import type { YandexMapCanvasProps } from '@/widgets/yandex-map/ui/yandex-map-canvas'
import { YandexMapCanvas } from '@/widgets/yandex-map/ui/yandex-map-canvas'

export type YandexMapPanelProps = YandexMapCanvasProps & {
  /** Заголовок над картой (опционально). */
  title?: string
  /** Подпись под заголовком. */
  description?: string
}

/**
 * Карта в карточке Mantine — удобно для дашборда и встроенных превью.
 */
const YandexMapPanel = ({ title, description, ...canvasProps }: YandexMapPanelProps) => {
  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="sm">
        {title ? (
          <div>
            <Text fw={600}>{title}</Text>
            {description ? (
              <Text size="sm" c="dimmed" mt={4}>
                {description}
              </Text>
            ) : null}
          </div>
        ) : null}
        <YandexMapCanvas {...canvasProps} />
      </Stack>
    </Paper>
  )
}
YandexMapPanel.displayName = 'YandexMapPanel'

export { YandexMapPanel }
