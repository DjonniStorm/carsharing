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

import { GeozoneType } from "@/entities/geozone";
import {
  GEOZONE_TYPES_ORDERED,
  geozoneTypeLangKey,
} from "@/features/geozones/lib/geozone-type-present";
import {
  geozonesCatalogAtom,
  geozonesCatalogErrorAtom,
  geozonesCatalogStatusAtom,
  loadGeozonesCatalog,
} from "@/features/geozones/model/geozones-state";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

import { GeozoneGridCard } from "@/pages/geozones/ui/geozone-grid-card";

const GeozonesPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(geozonesCatalogAtom);
  const [status] = useAtom(geozonesCatalogStatusAtom);
  const [error] = useAtom(geozonesCatalogErrorAtom);
  const load = useAction(loadGeozonesCatalog);

  const [nameQuery, setNameQuery] = useState("");
  const [debouncedName] = useDebouncedValue(nameQuery, 220);
  const [typeFilter, setTypeFilter] = useState<GeozoneType[]>([]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const typeSelectData = useMemo(() => {
    return GEOZONE_TYPES_ORDERED.map((gt) => ({
      value: gt,
      label: t(geozoneTypeLangKey(gt)),
    }));
  }, [t]);

  const filtered = useMemo(() => {
    const list = (rows ?? []).filter((z) => z.deletedAt == null);
    const q = debouncedName.trim().toLowerCase();
    const typesSet =
      typeFilter.length > 0 ? new Set(typeFilter as GeozoneType[]) : null;

    return list.filter((z) => {
      if (typesSet !== null && !typesSet.has(z.type)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return z.name.toLowerCase().includes(q);
    });
  }, [rows, debouncedName, typeFilter]);

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
    return (rows ?? []).filter((z) => z.deletedAt == null).length;
  }, [rows]);

  const byType = useMemo(() => {
    const list = (rows ?? []).filter((z) => z.deletedAt == null);
    const counts: Record<GeozoneType, number> = {
      [GeozoneType.RENTAL]: 0,
      [GeozoneType.PARKING]: 0,
      [GeozoneType.OTHER]: 0,
    };
    for (const z of list) {
      counts[z.type] = (counts[z.type] ?? 0) + 1;
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
          <Button component="span">{t(LANG_KEYS.pages.geozonesAddButton)}</Button>
        </Link>
      </Group>

      {status === "loading" ? (
        <Text c="dimmed" mt="md">
          {t(LANG_KEYS.pages.geozonesLoading)}
        </Text>
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.geozonesTitle)}>
          {error}
        </Alert>
      ) : (
        <Stack gap="xl" mt="lg">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {statPaper(LANG_KEYS.pages.geozonesStatTotal, totalActive)}
            {statPaper(
              LANG_KEYS.pages.geozonesTypeRental,
              byType[GeozoneType.RENTAL],
            )}
            {statPaper(
              LANG_KEYS.pages.geozonesTypeParking,
              byType[GeozoneType.PARKING],
            )}
            {statPaper(
              LANG_KEYS.pages.geozonesTypeOther,
              byType[GeozoneType.OTHER],
            )}
          </SimpleGrid>

          <Stack gap="md">
            <Title order={4}>{t(LANG_KEYS.pages.geozonesListSection)}</Title>
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                style={{ flex: "1 1 220px", minWidth: 200 }}
                placeholder={t(LANG_KEYS.pages.geozonesSearchPlaceholder)}
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.currentTarget.value);
                }}
              />
              <MultiSelect
                style={{ flex: "0 1 280px", minWidth: 200 }}
                label={t(LANG_KEYS.pages.geozonesFilterTypesLabel)}
                placeholder={t(LANG_KEYS.pages.geozonesFilterTypesPlaceholder)}
                clearable
                data={typeSelectData}
                value={typeFilter}
                onChange={(v) => {
                  setTypeFilter(v as GeozoneType[]);
                }}
              />
            </Group>

            {filtered.length === 0 ? (
              <Text c="dimmed">{t(LANG_KEYS.pages.geozonesEmptyFiltered)}</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {filtered.map((z) => (
                  <GeozoneGridCard key={z.id} zone={z} t={t} />
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};
GeozonesPage.displayName = "GeozonesPage";

export { GeozonesPage };
