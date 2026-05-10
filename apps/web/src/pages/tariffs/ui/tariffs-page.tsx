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
import { useDebouncedValue } from "@mantine/hooks";
import { useAction, useAtom } from "@reatom/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  loadTariffsCatalog,
  tariffsCatalogAtom,
  tariffsCatalogErrorAtom,
  tariffsCatalogStatusAtom,
} from "@/features/tariffs/model/tariffs-state";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

import { TariffGridCard } from "@/pages/tariffs/ui/tariff-grid-card";

type PresetFilter = "" | "default" | "nonDefault";

const TariffsPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(tariffsCatalogAtom);
  const [status] = useAtom(tariffsCatalogStatusAtom);
  const [error] = useAtom(tariffsCatalogErrorAtom);
  const loadTariffs = useAction(loadTariffsCatalog);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 220);
  const [presetFilter, setPresetFilter] = useState<PresetFilter>("");
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
    const list = rows ?? [];
    const q = debouncedSearch.trim().toLowerCase();

    return list.filter((row) => {
      if (hideDeleted && row.isDeleted) {
        return false;
      }
      if (presetFilter === "default" && !row.isDefault) {
        return false;
      }
      if (presetFilter === "nonDefault" && row.isDefault) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = `${row.name}\n${row.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [debouncedSearch, hideDeleted, presetFilter, rows]);

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
        <Text c="dimmed" mt="md">
          {t(LANG_KEYS.pages.tariffsLoading)}
        </Text>
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
                  setPresetFilter((v ?? "") as PresetFilter);
                }}
              />
              <Switch
                label={t(LANG_KEYS.pages.tariffsHideDeleted)}
                checked={hideDeleted}
                onChange={(e) => setHideDeleted(e.currentTarget.checked)}
              />
            </Group>

            {filtered.length === 0 ? (
              <Text c="dimmed">{t(LANG_KEYS.pages.tariffsEmptyFiltered)}</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {filtered.map((row) => (
                  <TariffGridCard key={row.id} tariff={row} t={t} />
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};
TariffsPage.displayName = "TariffsPage";

export { TariffsPage };
