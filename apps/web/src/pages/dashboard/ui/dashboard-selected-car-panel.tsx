import {
  ActionIcon,
  Box,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/shared/i18n/keys";

import { useDashboardSelectedCarLoad } from "@/pages/dashboard/hooks/use-dashboard-selected-car-load";
import { DashboardCarMetrics } from "@/pages/dashboard/ui/dashboard-car-metrics";
import { DashboardCarTripBlock } from "@/pages/dashboard/ui/dashboard-car-trip-block";

type Props = {
  carId: string | null;
  /** Показывать широкую панель с контентом; при `false` — узкая полоска «развернуть». */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClearSelection: () => void;
};

const stripWidth = 40;
const panelWidth = 300;

const DashboardSelectedCarPanel = ({
  carId,
  expanded,
  onExpandedChange,
  onClearSelection,
}: Props) => {
  const { t } = useTranslation();
  const { data, loading, error, liveOngoingTrip } =
    useDashboardSelectedCarLoad(carId);

  if (!carId) {
    return null;
  }

  const w = expanded ? panelWidth : stripWidth;

  return (
    <Box
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: w,
        zIndex: 4,
        display: "flex",
        flexDirection: "row",
        pointerEvents: "auto",
        transition: "width 160ms ease",
        boxShadow: expanded ? "-4px 0 24px rgba(0,0,0,0.08)" : undefined,
        background: "var(--mantine-color-body)",
        borderLeft: "1px solid var(--mantine-color-default-border)",
      }}
    >
      {!expanded ? (
        <Stack
          gap={4}
          justify="flex-start"
          align="center"
          pt="sm"
          style={{ width: stripWidth, flexShrink: 0 }}
        >
          <ActionIcon
            variant="light"
            size="sm"
            aria-label={t(LANG_KEYS.pages.dashboardCarPanelExpand)}
            title={t(LANG_KEYS.pages.dashboardCarPanelExpand)}
            onClick={() => {
              onExpandedChange(true);
            }}
          >
            ‹
          </ActionIcon>
          <Text
            size="10px"
            fw={700}
            c="dimmed"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {t(LANG_KEYS.pages.dashboardCarPanelShortTitle)}
          </Text>
        </Stack>
      ) : (
        <Stack
          gap={0}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
          }}
        >
          <Group justify="space-between" p="sm" wrap="nowrap">
            <Title order={5} lineClamp={2} style={{ flex: 1 }}>
              {data.car?.licensePlate ??
                t(LANG_KEYS.pages.dashboardCarPanelTitle)}
            </Title>
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                variant="subtle"
                size="sm"
                aria-label={t(LANG_KEYS.pages.dashboardCarPanelCollapse)}
                title={t(LANG_KEYS.pages.dashboardCarPanelCollapse)}
                onClick={() => {
                  onExpandedChange(false);
                }}
              >
                ›
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="sm"
                color="gray"
                aria-label={t(LANG_KEYS.pages.dashboardCarPanelClear)}
                title={t(LANG_KEYS.pages.dashboardCarPanelClear)}
                onClick={() => {
                  onClearSelection();
                }}
              >
                ×
              </ActionIcon>
            </Group>
          </Group>
          <Divider />
          <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
            <Stack gap="sm" p="sm" pb="xl">
              {loading ? (
                <Group justify="center" py="md">
                  <Loader size="sm" />
                </Group>
              ) : error ? (
                <Text size="sm" c="red">
                  {error}
                </Text>
              ) : data.car ? (
                <>
                  <DashboardCarMetrics car={data.car} />
                  <DashboardCarTripBlock
                    liveOngoingTrip={liveOngoingTrip}
                    driver={data.driver}
                    violationsCount={data.violationsCount}
                  />
                </>
              ) : null}
            </Stack>
          </ScrollArea>
        </Stack>
      )}
    </Box>
  );
};
DashboardSelectedCarPanel.displayName = "DashboardSelectedCarPanel";

export { DashboardSelectedCarPanel, panelWidth, stripWidth };
