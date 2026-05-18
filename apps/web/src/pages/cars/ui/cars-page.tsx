import { DonutChart } from "@mantine/charts";
import {
  Alert,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAction, useAtom } from "@reatom/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CarRead } from "@/entities/car";
import { CarStatus } from "@/entities/car";
import { AddCarToolbarButton } from "@/features/cars/add-car";
import { EditCarModal } from "@/features/cars/edit-car";
import { filterCarsList } from "@/features/cars/lib/cars-list-filters";
import {
  CAR_STATUSES_ORDERED,
  carStatusChartColor,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import {
  carsListAtom,
  carsListErrorAtom,
  carsListStatusAtom,
  loadCarsList,
} from "@/features/cars/model/cars-list";
import type { LangKey } from "@/shared/i18n/keys";
import { useClientPagination } from "@/shared/hooks/use-client-pagination";
import { useDebouncedSearch } from "@/shared/hooks/use-debounced-search";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ListPagination, PageLoader } from "@/shared/ui";

import { CarGridCard } from "@/pages/cars/ui/car-grid-card";

function countByStatus(fleet: CarRead[]): Record<CarStatus, number> {
  const initial = {} as Record<CarStatus, number>;
  for (const s of CAR_STATUSES_ORDERED) {
    initial[s] = 0;
  }
  for (const car of fleet) {
    initial[car.carStatus] = (initial[car.carStatus] ?? 0) + 1;
  }
  return initial;
}

const CarsPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(carsListAtom);
  const [loadStatus] = useAtom(carsListStatusAtom);
  const [error] = useAtom(carsListErrorAtom);
  const load = useAction(loadCarsList);

  const { query, setQuery, debouncedQuery } = useDebouncedSearch();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingCar, setEditingCar] = useState<CarRead | null>(null);

  useEffect(() => {
    void load(false);
  }, [load]);

  const fleet = useMemo(() => {
    return (rows ?? []).filter((c) => !c.isDeleted);
  }, [rows]);

  const counts = useMemo(() => {
    return countByStatus(fleet);
  }, [fleet]);

  const otherStatusesCount = useMemo(() => {
    return (
      (counts[CarStatus.UNAVAILABLE] ?? 0) +
      (counts[CarStatus.OUT_OF_SERVICE] ?? 0) +
      (counts[CarStatus.CREATED] ?? 0) +
      (counts[CarStatus.UNKNOWN] ?? 0)
    );
  }, [counts]);

  const chartData = useMemo(() => {
    return CAR_STATUSES_ORDERED.map((status) => ({
      name: t(carStatusLangKey(status)),
      value: counts[status] ?? 0,
      color: carStatusChartColor(status),
    })).filter((d) => d.value > 0);
  }, [counts, t]);

  const filteredCars = useMemo(() => {
    return filterCarsList(fleet, { debouncedQuery, statusFilter });
  }, [fleet, debouncedQuery, statusFilter]);

  const {
    page,
    setPage,
    resetPage,
    pageItems: pageCars,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filteredCars, { pageSize: 12 });

  useEffect(() => {
    resetPage();
  }, [debouncedQuery, statusFilter, resetPage]);

  const statusSelectData = useMemo(() => {
    return CAR_STATUSES_ORDERED.map((s) => ({
      value: String(s),
      label: t(carStatusLangKey(s)),
    }));
  }, [t]);

  const statPaper = (labelKey: LangKey, value: number) => (
    <Paper radius="md" p="md" withBorder shadow="xs">
      <Text size="xs" tt="uppercase" fw={600} c="dimmed">
        {t(labelKey)}
      </Text>
      <Text fw={800} fz={28} lh={1.2} mt={6}>
        {value}
      </Text>
    </Paper>
  );

  return (
    <Container size="xl" py="md" px="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Title order={2}>{t(LANG_KEYS.pages.carsTitle)}</Title>
        <AddCarToolbarButton onCreated={() => void load(false)} />
      </Group>

      {loadStatus === "loading" ? (
        <PageLoader messageKey={LANG_KEYS.common.loading} />
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.carsTitle)}>
          {error}
        </Alert>
      ) : (
        <Stack gap="xl" mt="lg">
          <Stack gap="sm">
            <Text fw={600}>{t(LANG_KEYS.pages.carsSummaryTitle)}</Text>
            <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="md">
              {statPaper(LANG_KEYS.pages.carsStatTotal, fleet.length)}
              {statPaper(
                LANG_KEYS.pages.carsStatAvailable,
                counts[CarStatus.AVAILABLE] ?? 0,
              )}
              {statPaper(
                LANG_KEYS.pages.carsStatInUse,
                counts[CarStatus.IN_USE] ?? 0,
              )}
              {statPaper(
                LANG_KEYS.pages.carsStatMaintenance,
                counts[CarStatus.MAINTENANCE] ?? 0,
              )}
              {statPaper(LANG_KEYS.pages.carsStatOther, otherStatusesCount)}
            </SimpleGrid>

            {fleet.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t(LANG_KEYS.pages.carsFleetEmpty)}
              </Text>
            ) : chartData.length > 0 ? (
              <Paper radius="md" p="md" withBorder>
                <Grid gap="lg">
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <Box
                      style={{ minHeight: 240, minWidth: 200, width: "100%" }}
                    >
                      <DonutChart
                        size={200}
                        thickness={28}
                        paddingAngle={2}
                        withTooltip
                        tooltipDataSource="segment"
                        data={chartData}
                        chartLabel={fleet.length}
                        mx={{ base: "auto", md: undefined }}
                        style={{ maxWidth: 280 }}
                      />
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 7 }}>
                    <Text fw={600} mb="sm">
                      {t(LANG_KEYS.pages.carsChartByStatus)}
                    </Text>
                    <Stack gap={6}>
                      {chartData.map((seg) => (
                        <Group
                          key={seg.name}
                          gap="xs"
                          justify="space-between"
                          wrap="nowrap"
                        >
                          <Group gap={8}>
                            <div
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                background: `var(--mantine-color-${String(seg.color).split(".")[0]}-filled)`,
                              }}
                            />
                            <Text size="sm">{seg.name}</Text>
                          </Group>
                          <Text size="sm" fw={600}>
                            {seg.value}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Paper>
            ) : null}
          </Stack>

          <Stack gap="md">
            <Title order={4}>{t(LANG_KEYS.pages.carsListSection)}</Title>
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                style={{ flex: "1 1 220px", minWidth: 200 }}
                placeholder={t(LANG_KEYS.pages.carsSearchPlaceholder)}
                value={query}
                onChange={(e) => {
                  setQuery(e.currentTarget.value);
                }}
              />
              <Select
                style={{ flex: "0 1 260px", minWidth: 200 }}
                label={t(LANG_KEYS.pages.carsFilterStatus)}
                placeholder={t(LANG_KEYS.pages.carsFilterAllStatuses)}
                clearable
                data={statusSelectData}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </Group>

            {pageCars.length === 0 ? (
              <Text c="dimmed">
                {fleet.length === 0
                  ? t(LANG_KEYS.pages.carsFleetEmpty)
                  : t(LANG_KEYS.pages.carsEmptyFiltered)}
              </Text>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {pageCars.map((car) => (
                    <CarGridCard
                      key={car.id}
                      car={car}
                      t={t}
                      onEdit={(c) => {
                        setEditingCar(c);
                      }}
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
      <EditCarModal
        car={editingCar}
        opened={editingCar !== null}
        onClose={() => {
          setEditingCar(null);
        }}
        onSaved={() => {
          void load(false);
        }}
      />
    </Container>
  );
};
CarsPage.displayName = "CarsPage";

export { CarsPage };
