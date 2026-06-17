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
import { useAction, useAtom } from "@reatom/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GeozoneType } from "@/entities/geozone";
import { buildGeozoneTypeSelectData } from "@/features/geozones/lib/geozone-form-present";
import { filterGeozonesList } from "@/features/geozones/lib/geozones-list-filters";
import {
  geozonesCatalogAtom,
  geozonesCatalogErrorAtom,
  geozonesCatalogStatusAtom,
  loadGeozonesCatalog,
} from "@/features/geozones/model/geozones-state";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";
import { useClientPagination } from "@/shared/hooks/use-client-pagination";
import { useDebouncedSearch } from "@/shared/hooks/use-debounced-search";
import { ListPagination, PageLoader } from "@/shared/ui";

import { GeozoneGridCard } from "@/pages/geozones/ui/geozone-grid-card";

const GeozonesPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(geozonesCatalogAtom);
  const [status] = useAtom(geozonesCatalogStatusAtom);
  const [error] = useAtom(geozonesCatalogErrorAtom);
  const load = useAction(loadGeozonesCatalog);

  const {
    query: nameQuery,
    setQuery: setNameQuery,
    debouncedQuery: debouncedName,
    maxLength: searchMaxLength,
  } = useDebouncedSearch();
  const [typeFilter, setTypeFilter] = useState<GeozoneType[]>([]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const typeSelectData = buildGeozoneTypeSelectData(t);

  const filtered = useMemo(() => {
    return filterGeozonesList(rows ?? [], {
      debouncedName,
      typeFilter,
    });
  }, [rows, debouncedName, typeFilter]);

  const {
    page,
    setPage,
    resetPage,
    pageItems: pageZones,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filtered, { pageSize: 12 });

  useEffect(() => {
    resetPage();
  }, [debouncedName, typeFilter, resetPage]);

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

  const totalActive = useMemo(() => {
    return (rows ?? []).filter((zone) => zone.deletedAt == null).length;
  }, [rows]);

  const byType = useMemo(() => {
    const list = (rows ?? []).filter((zone) => zone.deletedAt == null);
    const counts: Record<GeozoneType, number> = {
      [GeozoneType.RENTAL]: 0,
      [GeozoneType.PARKING]: 0,
      [GeozoneType.OTHER]: 0,
    };
    for (const zone of list) {
      counts[zone.type] = (counts[zone.type] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  return (
    <Container size="xl" py="md" px="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Title order={2}>{t(LANG_KEYS.pages.geozonesTitle)}</Title>
        <Link
          to={ROUTES.dashboard.geozonesNew}
          style={{ textDecoration: "none" }}
        >
          <Button component="span">
            {t(LANG_KEYS.pages.geozonesAddButton)}
          </Button>
        </Link>
      </Group>

      {status === "loading" ? (
        <PageLoader messageKey={LANG_KEYS.common.loading} />
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.geozonesTitle)}>
          {error}
        </Alert>
      ) : (
        <Stack gap="xl" mt="lg">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {statPaper(LANG_KEYS.pages.geozonesStatTotal, totalActive)}
            {statPaper(
              LANG_KEYS.pages.geozonesTypeRental,
              byType[GeozoneType.RENTAL],
            )}
            {statPaper(
              LANG_KEYS.pages.geozonesTypeParking,
              byType[GeozoneType.PARKING],
            )}
          </SimpleGrid>

          <Stack gap="md">
            <Title order={4}>{t(LANG_KEYS.pages.geozonesListSection)}</Title>
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                style={{ flex: "1 1 220px", minWidth: 200 }}
                placeholder={t(LANG_KEYS.pages.geozonesSearchPlaceholder)}
                maxLength={searchMaxLength}
                value={nameQuery}
                onChange={(event) => {
                  setNameQuery(event.currentTarget.value);
                }}
              />
              <MultiSelect
                style={{ flex: "0 1 280px", minWidth: 200 }}
                label={t(LANG_KEYS.pages.geozonesFilterTypesLabel)}
                placeholder={t(LANG_KEYS.pages.geozonesFilterTypesPlaceholder)}
                clearable
                data={typeSelectData}
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value as GeozoneType[]);
                }}
              />
            </Group>

            {pageZones.length === 0 ? (
              <Text c="dimmed">{t(LANG_KEYS.pages.geozonesEmptyFiltered)}</Text>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {pageZones.map((zone) => (
                    <GeozoneGridCard key={zone.id} zone={zone} t={t} />
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
GeozonesPage.displayName = "GeozonesPage";

export { GeozonesPage };
