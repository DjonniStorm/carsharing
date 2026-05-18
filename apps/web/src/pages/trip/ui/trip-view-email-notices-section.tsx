import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import type { TripNotificationRead } from "@/entities/manager-violation-notice";
import type { ReadUser } from "@/entities/user";
import type { ViolationRead } from "@/entities/violation";
import {
  tripNotificationDetailsText,
  tripNotificationMessagePreview,
} from "@/features/manager-violation-notice/lib/trip-notification-preview";
import {
  PencilGlyph,
  ViolationSummaryCard,
} from "@/features/violations/ui/violation-summary-card";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { tripEmailNoticeBadgeColor } from "@/pages/trip/ui/trip-view-row";
import { TripViewUserNameLink } from "@/pages/trip/ui/trip-view-user-name-link";

type Props = {
  phase: "loading" | "ok" | "error";
  error: string | null;
  notices: TripNotificationRead[];
  violationById: Map<string, ViolationRead>;
  userById: Map<string, ReadUser>;
};

function emailNoticeStatusLabel(t: TFunction, status: string): string {
  const s = (status || "").toUpperCase();
  if (s === "SENT") {
    return t(LANG_KEYS.pages.tripDetailEmailNoticeStatusSENT);
  }
  if (s === "FAILED") {
    return t(LANG_KEYS.pages.tripDetailEmailNoticeStatusFAILED);
  }
  if (s === "PENDING") {
    return t(LANG_KEYS.pages.tripDetailEmailNoticeStatusPENDING);
  }
  return status || "—";
}

export function TripViewEmailNoticesSection({
  phase,
  error,
  notices,
  violationById,
  userById,
}: Props) {
  const { t } = useTranslation();

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={700} tt="uppercase" c="dimmed">
          {t(LANG_KEYS.pages.tripDetailSectionExtra)}
        </Text>
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.pages.tripDetailEmailNoticesIntro)}
        </Text>
        {phase === "loading" ? (
          <Group gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              {t(LANG_KEYS.pages.tripDetailMapZoneLoading)}
            </Text>
          </Group>
        ) : phase === "error" ? (
          <Alert color="red" variant="light">
            {error ?? t(LANG_KEYS.pages.tripDetailEmailNoticesLoadError)}
          </Alert>
        ) : notices.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.tripDetailEmailNoticesEmpty)}
          </Text>
        ) : (
          <Accordion variant="contained" radius="md">
            {notices.map((n) => {
              const stLabel = emailNoticeStatusLabel(t, n.status);
              return (
                <Accordion.Item key={n.id} value={String(n.id)}>
                  <Accordion.Control>
                    <Stack gap={4} align="flex-start">
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm" fw={600}>
                          {t(LANG_KEYS.pages.tripDetailEmailNoticeId)}
                          {n.id}
                        </Text>
                        <Badge
                          size="sm"
                          color={tripEmailNoticeBadgeColor(n.status)}
                          variant="light"
                        >
                          {stLabel}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {tripNotificationMessagePreview(n.message) || "—"}
                      </Text>
                    </Stack>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      <Paper withBorder p="md" radius="md">
                        <Stack gap="sm">
                          <Text size="xs" c="dimmed">
                            <Text span fw={600}>
                              {t(LANG_KEYS.pages.tripViewUser)}
                            </Text>{" "}
                            <TripViewUserNameLink
                              userId={n.userId}
                              userById={userById}
                            />
                          </Text>
                          <Text
                            size="sm"
                            lh={1.55}
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {tripNotificationDetailsText(n.message) || "—"}
                          </Text>
                        </Stack>
                      </Paper>
                      <Divider />
                      <Text size="sm" fw={600}>
                        {t(
                          LANG_KEYS.pages
                            .tripDetailEmailNoticeViolationsInLetter,
                        )}
                      </Text>
                      <Stack gap="md">
                        {n.violationIds.map((vid) => {
                          const v = violationById.get(vid);
                          return v ? (
                            <ViolationSummaryCard
                              key={vid}
                              violation={v}
                              showEditInNewTab
                            />
                          ) : (
                            <Group
                              key={vid}
                              justify="space-between"
                              wrap="nowrap"
                              align="center"
                              gap="xs"
                            >
                              <Text
                                size="sm"
                                c="dimmed"
                                style={{ flex: 1 }}
                              >
                                {t(
                                  LANG_KEYS.pages
                                    .tripDetailEmailNoticeViolationMissing,
                                  { id: vid },
                                )}
                              </Text>
                              <ActionIcon
                                component={Link}
                                to={ROUTES.dashboard.violationsEdit(vid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="light"
                                color="gray"
                                size="md"
                                radius="md"
                                aria-label={t(
                                  LANG_KEYS.pages
                                    .tripDetailViolationOpenEditNewTab,
                                )}
                              >
                                <PencilGlyph />
                              </ActionIcon>
                            </Group>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}
      </Stack>
    </Paper>
  );
}
