import {
  Alert,
  Button,
  Container,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAction, useAtom } from "@reatom/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  filterTariffsList,
  type TariffPresetFilter,
} from "@/features/tariffs/lib/tariffs-list-filters";
import {
  loadTariffsCatalog,
  tariffsCatalogAtom,
  tariffsCatalogErrorAtom,
  tariffsCatalogStatusAtom,
} from "@/features/tariffs/model/tariffs-state";
import { ROUTES } from "@/shared/config/routes-paths";
import { useClientPagination } from "@/shared/hooks/use-client-pagination";
import { useDebouncedSearch } from "@/shared/hooks/use-debounced-search";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ListPagination, PageLoader } from "@/shared/ui";

import { TariffGridCard } from "@/pages/tariffs/ui/tariff-grid-card";

const TariffsPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(tariffsCatalogAtom);
  const [status] = useAtom(tariffsCatalogStatusAtom);
  const [error] = useAtom(tariffsCatalogErrorAtom);
  const loadTariffs = useAction(loadTariffsCatalog);

  const { query: searchQuery, setQuery: setSearchQuery, debouncedQuery: debouncedSearch } =
    useDebouncedSearch();
  const [presetFilter, setPresetFilter] = useState<TariffPresetFilter>("");
  const [hideDeleted, setHideDeleted] = useState(true);

  useEffect(() => {
    void loadTariffs({ includeDeleted: true });
  }, [loadTariffs]);

  const presetFilterData = useMemo(() => {
    return [
      { value: "", label: t(LANG_KEYS.pages.tariffsFilterPresetAll) },
      {
        value: "default",
        label: t(LANG_KEYS.pages.tariffsFilterPresetDefaultOnly),
      },
      {
        value: "nonDefault",
        label: t(LANG_KEYS.pages.tariffsFilterPresetNonDefaultOnly),
      },
    ];
  }, [t]);

  const filtered = useMemo(() => {
    return filterTariffsList(rows ?? [], {
      debouncedSearch,
      presetFilter,
      hideDeleted,
    });
  }, [debouncedSearch, hideDeleted, presetFilter, rows]);

  const {
    page,
    setPage,
    resetPage,
    pageItems: pageTariffs,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filtered, { pageSize: 12 });

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, presetFilter, hideDeleted, resetPage]);

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
    let deleted = 0;
    let defaultActive = 0;
    for (const row of list) {
      if (row.isDeleted) {
        deleted += 1;
      } else {
        active += 1;
        if (row.isDefault) {
          defaultActive += 1;
        }
      }
    }
    return {
      total: list.length,
      active,
      deleted,
      defaultActive,
    };
  }, [rows]);

  return (
    <Container size="xl" py="md" px="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Title order={2}>{t(LANG_KEYS.pages.tariffsTitle)}</Title>
        <Link
          to={ROUTES.dashboard.tariffsNew}
          style={{ textDecoration: "none" }}
        >
          <Button component="span">
            {t(LANG_KEYS.pages.tariffsAddButton)}
          </Button>
        </Link>
      </Group>

      {status === "loading" ? (
        <PageLoader messageKey={LANG_KEYS.common.loading} />
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.tariffsTitle)}>
          {error}
        </Alert>
      ) : (
        <Stack gap="xl" mt="lg">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {statPaper(LANG_KEYS.pages.tariffsStatTotal, stats.total)}
            {statPaper(LANG_KEYS.pages.tariffsStatActive, stats.active)}
            {statPaper(LANG_KEYS.pages.tariffsStatDeleted, stats.deleted)}
            {statPaper(
              LANG_KEYS.pages.tariffsStatDefaultActive,
              stats.defaultActive,
            )}
          </SimpleGrid>

          <Stack gap="md">
            <Title order={4}>{t(LANG_KEYS.pages.tariffsListSection)}</Title>
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                style={{ flex: "1 1 220px", minWidth: 200 }}
                placeholder={t(LANG_KEYS.pages.tariffsSearchPlaceholder)}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.currentTarget.value);
                }}
              />
              <Select
                style={{ flex: "0 1 260px", minWidth: 180 }}
                label={t(LANG_KEYS.pages.tariffsFilterPresetLabel)}
                data={presetFilterData}
                value={presetFilter}
                onChange={(v) => {
                  setPresetFilter((v ?? "") as TariffPresetFilter);
                }}
              />
              <Switch
                label={t(LANG_KEYS.pages.tariffsHideDeleted)}
                checked={hideDeleted}
                onChange={(e) => setHideDeleted(e.currentTarget.checked)}
              />
            </Group>

            {pageTariffs.length === 0 ? (
              <Text c="dimmed">{t(LANG_KEYS.pages.tariffsEmptyFiltered)}</Text>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {pageTariffs.map((row) => (
                    <TariffGridCard key={row.id} tariff={row} t={t} />
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
TariffsPage.displayName = "TariffsPage";

export { TariffsPage };
