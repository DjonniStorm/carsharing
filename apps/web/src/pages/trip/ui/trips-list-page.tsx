import {
  Alert,
  Container,
  Group,
  MultiSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAction, useAtom } from "@reatom/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TripStatus } from "@/entities/trip";
import {
  buildTripStatusSelectData,
  isTripOngoing,
} from "@/features/trips/lib/trip-status-present";
import { filterTripsList } from "@/features/trips/lib/trips-list-filters";
import {
  loadTripsAdminList,
  tripsAdminListAtom,
  tripsAdminListErrorAtom,
  tripsAdminListStatusAtom,
} from "@/features/trips/model/trips-list-state";
import { useClientPagination } from "@/shared/hooks/use-client-pagination";
import { useDebouncedSearch } from "@/shared/hooks/use-debounced-search";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ListPagination, PageLoader } from "@/shared/ui";

import { TripGridCard } from "@/pages/trip/ui/trip-grid-card";

const TripsListPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [rows] = useAtom(tripsAdminListAtom);
  const [status] = useAtom(tripsAdminListStatusAtom);
  const [error] = useAtom(tripsAdminListErrorAtom);
  const load = useAction(loadTripsAdminList);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    debouncedQuery: debouncedSearch,
  } = useDebouncedSearch();
  const [statusFilter, setStatusFilter] = useState<TripStatus[]>([]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusSelectData = buildTripStatusSelectData(t);

  const filtered = useMemo(() => {
    return filterTripsList(rows ?? [], {
      debouncedSearch,
      statusFilter,
    });
  }, [rows, debouncedSearch, statusFilter]);

  const {
    page,
    setPage,
    resetPage,
    pageItems: pageTrips,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filtered, { pageSize: 12 });

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, statusFilter, resetPage]);

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
    let active = 0;
    let finished = 0;
    for (const trip of list) {
      if (trip.status === TripStatus.FINISHED) {
        finished += 1;
      } else if (isTripOngoing(trip.status)) {
        active += 1;
      }
    }
    return { total: list.length, active, finished };
  }, [rows]);

  return (
    <Container size="xl" py="md" px="md">
      <Title order={2}>{t(LANG_KEYS.pages.tripsTitle)}</Title>

      {status === "loading" ? (
        <PageLoader messageKey={LANG_KEYS.common.loading} />
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.tripsTitle)}>
          {error}
        </Alert>
      ) : (
        <Stack gap="xl" mt="lg">
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            {statPaper(LANG_KEYS.pages.tripsStatTotal, stats.total)}
            {statPaper(LANG_KEYS.pages.tripsStatActive, stats.active)}
            {statPaper(LANG_KEYS.pages.tripsStatFinished, stats.finished)}
          </SimpleGrid>

          <Stack gap="md">
            <Title order={4}>{t(LANG_KEYS.pages.tripsListSection)}</Title>
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                style={{ flex: "1 1 220px", minWidth: 200 }}
                placeholder={t(LANG_KEYS.pages.tripsSearchPlaceholder)}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.currentTarget.value);
                }}
              />
              <MultiSelect
                style={{ flex: "0 1 280px", minWidth: 200 }}
                label={t(LANG_KEYS.pages.tripsFilterStatusLabel)}
                placeholder={t(LANG_KEYS.pages.tripsFilterStatusPlaceholder)}
                clearable
                data={statusSelectData}
                value={statusFilter.map(String)}
                onChange={(v) => {
                  setStatusFilter(v.map((x) => Number(x) as TripStatus));
                }}
              />
            </Group>

            {pageTrips.length === 0 ? (
              <Text c="dimmed">{t(LANG_KEYS.pages.tripsEmptyFiltered)}</Text>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {pageTrips.map((trip) => (
                    <TripGridCard
                      key={trip.id}
                      trip={trip}
                      t={t}
                      locale={locale}
                    />
                  ))}
                </SimpleGrid>
                <ListPagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  onChange={setPage}
                />
              </>
            )}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};
TripsListPage.displayName = "TripsListPage";

export { TripsListPage };
