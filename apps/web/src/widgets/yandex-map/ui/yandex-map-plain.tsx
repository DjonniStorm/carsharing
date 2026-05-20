import type { YandexMapCanvasProps } from "@/widgets/yandex-map/ui/yandex-map-canvas";
import { YandexMapCanvas } from "@/widgets/yandex-map/ui/yandex-map-canvas";

const YandexMapPlain = (props: YandexMapCanvasProps) => {
  return <YandexMapCanvas {...props} />;
};
YandexMapPlain.displayName = "YandexMapPlain";

export { YandexMapPlain };
