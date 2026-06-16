import {
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAction, useAtom } from "@reatom/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { UserRole } from "@/entities/user";
import {
  filterUsersList,
  type UsersStatusFilter,
} from "@/features/users/lib/users-list-filters";
import {
  loadUsersList,
  usersListAtom,
  usersListErrorAtom,
  usersListStatusAtom,
} from "@/features/users/model/users-list";
import { ROUTES } from "@/shared/config/routes-paths";
import { useClientPagination } from "@/shared/hooks/use-client-pagination";
import { useDebouncedSearch } from "@/shared/hooks/use-debounced-search";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ListPagination, PageLoader } from "@/shared/ui";

function roleLangKey(role: UserRole): LangKey {
  const r = Number(role);
  switch (r) {
    case UserRole.MANAGER:
      return LANG_KEYS.auth.roleManager;
    case UserRole.DRIVER:
      return LANG_KEYS.auth.roleDriver;
    case UserRole.SYSTEM_ADMIN:
      return LANG_KEYS.auth.roleSystemAdmin;
    default:
      return LANG_KEYS.auth.roleDriver;
  }
}

const UsersListPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(usersListAtom);
  const [status] = useAtom(usersListStatusAtom);
  const [error] = useAtom(usersListErrorAtom);
  const load = useAction(loadUsersList);

  const {
    query,
    setQuery,
    debouncedQuery,
    maxLength: searchMaxLength,
  } = useDebouncedSearch();
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<UsersStatusFilter>("all");

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return filterUsersList(rows ?? [], {
      debouncedQuery,
      roleFilter,
      statusFilter,
    });
  }, [rows, debouncedQuery, roleFilter, statusFilter]);

  const {
    page,
    setPage,
    resetPage,
    pageItems,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filtered, { pageSize: 20 });

  useEffect(() => {
    resetPage();
  }, [debouncedQuery, roleFilter, statusFilter, resetPage]);

  const roleSelectData = useMemo(() => {
    return [
      {
        value: String(UserRole.MANAGER),
        label: t(LANG_KEYS.auth.roleManager),
      },
      {
        value: String(UserRole.DRIVER),
        label: t(LANG_KEYS.auth.roleDriver),
      },
      {
        value: String(UserRole.SYSTEM_ADMIN),
        label: t(LANG_KEYS.auth.roleSystemAdmin),
      },
    ];
  }, [t]);

  const statusSelectData = useMemo(() => {
    return [
      { value: "all", label: t(LANG_KEYS.pages.usersListFilterStatusAll) },
      {
        value: "active",
        label: t(LANG_KEYS.pages.usersListFilterStatusActive),
      },
      {
        value: "inactive",
        label: t(LANG_KEYS.pages.usersListFilterStatusInactive),
      },
      {
        value: "deleted",
        label: t(LANG_KEYS.pages.usersListFilterStatusDeleted),
      },
    ];
  }, [t]);

  const loading = status === "loading" && !rows;

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Title order={2}>{t(LANG_KEYS.pages.usersListTitle)}</Title>

        {error ? <Alert color="red">{error}</Alert> : null}

        <Group align="flex-end" wrap="wrap" gap="sm">
          <TextInput
            label={t(LANG_KEYS.pages.usersListSearchLabel)}
            placeholder={t(LANG_KEYS.pages.usersListSearchPlaceholder)}
            maxLength={searchMaxLength}
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
            }}
            style={{ flex: "1 1 220px", minWidth: 200 }}
          />
          <Select
            label={t(LANG_KEYS.pages.usersListFilterRole)}
            placeholder={t(LANG_KEYS.pages.usersListFilterRoleAll)}
            clearable
            data={roleSelectData}
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 200 }}
          />
          <Select
            label={t(LANG_KEYS.pages.usersListFilterStatus)}
            data={statusSelectData}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter((v as UsersStatusFilter) ?? "all");
            }}
            style={{ width: 200 }}
          />
          <Button variant="light" onClick={() => void load()}>
            {t(LANG_KEYS.pages.usersListRefresh)}
          </Button>
        </Group>

        {loading ? (
          <PageLoader messageKey={LANG_KEYS.common.loading} />
        ) : (
          <>
            <ScrollArea>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t(LANG_KEYS.pages.usersListColName)}</Table.Th>
                    <Table.Th>{t(LANG_KEYS.pages.usersListColEmail)}</Table.Th>
                    <Table.Th>{t(LANG_KEYS.pages.usersListColPhone)}</Table.Th>
                    <Table.Th>{t(LANG_KEYS.pages.usersListColRole)}</Table.Th>
                    <Table.Th>{t(LANG_KEYS.pages.usersListColStatus)}</Table.Th>
                    <Table.Th w={120} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pageItems.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" size="sm" py="md" ta="center">
                          {rows && rows.length > 0
                            ? t(LANG_KEYS.pages.usersListEmptyFiltered)
                            : t(LANG_KEYS.pages.usersListEmpty)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    pageItems.map((u) => {
                      const deleted = u.isDeleted === true;
                      const inactive = !deleted && u.isActive === false;
                      return (
                        <Table.Tr
                          key={u.id}
                          style={{
                            opacity: deleted ? 0.65 : 1,
                          }}
                        >
                          <Table.Td>
                            <Text fw={500}>{u.name}</Text>
                            <Text size="xs" c="dimmed">
                              {u.id}
                            </Text>
                          </Table.Td>
                          <Table.Td>{u.email}</Table.Td>
                          <Table.Td>{u.phone}</Table.Td>
                          <Table.Td>{t(roleLangKey(u.role))}</Table.Td>
                          <Table.Td>
                            {deleted ? (
                              <Badge color="gray" variant="light">
                                {t(LANG_KEYS.pages.userViewDeleted)}
                              </Badge>
                            ) : inactive ? (
                              <Badge color="orange" variant="light">
                                {t(LANG_KEYS.pages.userViewInactive)}
                              </Badge>
                            ) : (
                              <Badge color="green" variant="light">
                                {t(LANG_KEYS.pages.userViewActive)}
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Anchor
                              component={Link}
                              to={ROUTES.dashboard.userView(u.id)}
                              size="sm"
                            >
                              {t(LANG_KEYS.pages.usersListOpen)}
                            </Anchor>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
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
    </Container>
  );
};
UsersListPage.displayName = "UsersListPage";

export { UsersListPage };
