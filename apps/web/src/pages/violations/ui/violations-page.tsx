import {
  Alert,
  Container,
  ScrollArea,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useAction, useAtom } from "@reatom/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import {
  loadViolationsAdminList,
  violationsAdminListAtom,
  violationsAdminListErrorAtom,
  violationsAdminListStatusAtom,
} from "@/features/violations/model/violations-state";
import { LANG_KEYS } from "@/shared/i18n/keys";

const ViolationsPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(violationsAdminListAtom);
  const [status] = useAtom(violationsAdminListStatusAtom);
  const [error] = useAtom(violationsAdminListErrorAtom);
  const load = useAction(loadViolationsAdminList);

  useEffect(() => {
    void load({ includeResolved: true });
  }, [load]);

  return (
    <Container size="lg" py="md" px="md">
      <Title order={2}>{t(LANG_KEYS.pages.violationsTitle)}</Title>
      <Text c="dimmed" mt="xs" size="sm">
        {t(LANG_KEYS.pages.violationsStub)}
      </Text>

      {status === "loading" ? (
        <Text c="dimmed" mt="md">
          {t(LANG_KEYS.pages.violationsLoading)}
        </Text>
      ) : error ? (
        <Alert color="red" mt="md" title={t(LANG_KEYS.pages.violationsTitle)}>
          {error}
        </Alert>
      ) : (
        <ScrollArea mt="md">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t(LANG_KEYS.pages.violationsColTrip)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.violationsColType)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.violationsColDesc)}</Table.Th>
                <Table.Th>{t(LANG_KEYS.pages.violationsColCreated)}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(rows ?? []).map((v) => (
                <Table.Tr key={v.id}>
                  <Table.Td>{v.tripId}</Table.Td>
                  <Table.Td>{ViolationStatus[v.type] ?? v.type}</Table.Td>
                  <Table.Td>{v.description}</Table.Td>
                  <Table.Td>{v.createdAt}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Container>
  );
};
ViolationsPage.displayName = "ViolationsPage";

export { ViolationsPage };
