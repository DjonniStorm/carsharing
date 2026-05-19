import {
  Button,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { ViolationRead } from "@/entities/violation";
import { ViolationSummaryCard } from "@/features/violations/ui/violation-summary-card";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { TripViewRow } from "@/pages/trip/ui/trip-view-row";

type Props = {
  violations: ViolationRead[];
  canSendViolationNotice: boolean;
  onNotifyDriver: () => void;
};

export function TripViewViolationsSection({
  violations,
  canSendViolationNotice,
  onNotifyDriver,
}: Props) {
  const { t } = useTranslation();

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={700} tt="uppercase" c="dimmed">
          {t(LANG_KEYS.pages.tripDetailSectionViolations)}
        </Text>
        <Divider />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailViolationsCount)}
          value={violations.length}
        />
        {violations.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.tripDetailViolationsEmpty)}
          </Text>
        ) : (
          <Stack gap="md">
            {canSendViolationNotice ? (
              <Group justify="flex-end">
                <Button size="xs" variant="light" onClick={onNotifyDriver}>
                  {t(LANG_KEYS.pages.tripDetailViolationsNotifyDriver)}
                </Button>
              </Group>
            ) : null}
            <ScrollArea h={500}>
              {violations.map((v) => (
                <ViolationSummaryCard key={v.id} violation={v} />
              ))}
            </ScrollArea>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
