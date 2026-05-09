import {
  Alert,
  ColorSwatch,
  Container,
  Group,
  ScrollArea,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useAction, useAtom } from "@reatom/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  geozonesCatalogAtom,
  geozonesCatalogErrorAtom,
  geozonesCatalogStatusAtom,
  loadGeozonesCatalog,
} from "@/features/geozones/model/geozones-state";
import { LANG_KEYS } from "@/shared/i18n/keys";

const GeozonesPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(geozonesCatalogAtom);
  const [status] = useAtom(geozonesCatalogStatusAtom);
  const [error] = useAtom(geozonesCatalogErrorAtom);
  const load = useAction(loadGeozonesCatalog);

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <Container size="lg" py="md" px="md">
      <Title order={2}>{t(LANG_KEYS.pages.geozonesTitle)}</Title>
      <Text c="dimmed" mt="xs" size="sm">
        {t(LANG_KEYS.pages.geozonesStub)}
      </Text>
      {status === "loading" ? (
        <Text c="dimmed" mt="md">
          {t(LANG_KEYS.pages.geozonesLoading)}
        </Text>
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.geozonesTitle)}>
          {error}
        </Alert>
      ) : (
        <ScrollArea mt="md">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t(LANG_KEYS.pages.geozonesColName)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.geozonesColType)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.geozonesColColor)}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(rows ?? []).map((z) => (
                <Table.Tr key={z.id}>
                  <Table.Td>{z.name}</Table.Td>
                  <Table.Td>{z.type}</Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      <ColorSwatch color={z.color} size={20} />
                      <Text size="sm">{z.color}</Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Container>
  );
};
GeozonesPage.displayName = "GeozonesPage";

export { GeozonesPage };
