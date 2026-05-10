import {
  Alert,
  Button,
  Container,
  Group,
  MultiSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useAction, useAtom } from "@reatom/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import {
  VIOLATION_STATUSES_ORDERED,
  isViolationTerminal,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import {
  loadViolationsAdminList,
  violationsAdminListAtom,
  violationsAdminListErrorAtom,
  violationsAdminListStatusAtom,
} from "@/features/violations/model/violations-state";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

import { ViolationGridCard } from "@/pages/violations/ui/violation-grid-card";

const ViolationsPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(violationsAdminListAtom);
  const [status] = useAtom(violationsAdminListStatusAtom);
  const [error] = useAtom(violationsAdminListErrorAtom);
  const load = useAction(loadViolationsAdminList);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 220);
  const [typeFilter, setTypeFilter] = useState<ViolationStatus[]>([]);

  useEffect(() => {
    void load({ includeResolved: true });
  }, [load]);

  const typeSelectData = useMemo(() => {
    return VIOLATION_STATUSES_ORDERED.map((s) => ({
      value: String(s),
      label: t(violationStatusLangKey(s)),
    }));
  }, [t]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    const typesSet =
      typeFilter.length > 0 ? new Set(typeFilter as ViolationStatus[]) : null;

    return list.filter((v) => {
      if (typesSet !== null && !typesSet.has(v.type)) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = `${v.description}\n${v.tripId}\n${v.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, debouncedSearch, typeFilter]);

  const statPaper = (labelKey: LangKey, value: number) => (
    <Stack gap={4}>
      <Text size="xs" tt="uppercase" fw={600} c="dimmed">
        {t(labelKey)}
      </Text>
      <Text fw={700} fz={22}>
        {value}
      </Text>
    </Stack>
  );

  const stats = useMemo(() => {
    const list = rows ?? [];
    let open = 0;
    let resolved = 0;
    let ignored = 0;
    for (const v of list) {
      if (v.type === ViolationStatus.RESOLVED) {
        resolved += 1;
      } else if (v.type === ViolationStatus.IGNORED) {
        ignored += 1;
      } else if (!isViolationTerminal(v.type)) {
        open += 1;
      }
    }
    return { total: list.length, open, resolved, ignored };
  }, [rows]);

  return (
    <Container size="xl" py="md" px="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Title order={2}>{t(LANG_KEYS.pages.violationsTitle)}</Title>
        <Link
          to={ROUTES.dashboard.violationsNew}
          style={{ textDecoration: "none" }}
        >
          <Button component="span">
            {t(LANG_KEYS.pages.violationsAddButton)}
          </Button>
        </Link>
      </Group>

      {status === "loading" ? (
        <Text c="dimmed" mt="md">
          {t(LANG_KEYS.pages.violationsLoading)}
        </Text>
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.violationsTitle)}>
          {error}
        </Alert>
      ) : (
        <Stack gap="xl" mt="lg">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {statPaper(LANG_KEYS.pages.violationsStatTotal, stats.total)}
            {statPaper(LANG_KEYS.pages.violationsStatOpen, stats.open)}
            {statPaper(LANG_KEYS.pages.violationsStatResolved, stats.resolved)}
            {statPaper(LANG_KEYS.pages.violationsStatIgnored, stats.ignored)}
          </SimpleGrid>

          <Stack gap="md">
            <Title order={4}>{t(LANG_KEYS.pages.violationsListSection)}</Title>
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                style={{ flex: "1 1 220px", minWidth: 200 }}
                placeholder={t(LANG_KEYS.pages.violationsSearchPlaceholder)}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.currentTarget.value);
                }}
              />
              <MultiSelect
                style={{ flex: "0 1 280px", minWidth: 200 }}
                label={t(LANG_KEYS.pages.violationsFilterTypesLabel)}
                placeholder={t(
                  LANG_KEYS.pages.violationsFilterTypesPlaceholder,
                )}
                clearable
                data={typeSelectData}
                value={typeFilter.map(String)}
                onChange={(v) => {
                  setTypeFilter(v.map((x) => Number(x) as ViolationStatus));
                }}
              />
            </Group>

            {filtered.length === 0 ? (
              <Text c="dimmed">
                {t(LANG_KEYS.pages.violationsEmptyFiltered)}
              </Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {filtered.map((v) => (
                  <ViolationGridCard key={v.id} violation={v} t={t} />
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};
ViolationsPage.displayName = "ViolationsPage";

export { ViolationsPage };
