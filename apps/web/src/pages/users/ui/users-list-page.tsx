import {
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useAction, useAtom } from "@reatom/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReadUser } from "@/entities/user";
import { UserRole } from "@/entities/user";
import {
  loadUsersList,
  usersListAtom,
  usersListErrorAtom,
  usersListStatusAtom,
} from "@/features/users/model/users-list";
import { ROUTES } from "@/shared/config/routes-paths";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

type StatusFilter = "all" | "active" | "inactive" | "deleted";

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

function matchesAccountStatus(user: ReadUser, filter: StatusFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "deleted") {
    return user.isDeleted === true;
  }
  if (user.isDeleted === true) {
    return false;
  }
  if (filter === "inactive") {
    return user.isActive === false;
  }
  if (filter === "active") {
    return user.isActive !== false;
  }
  return true;
}

function matchesSearch(user: ReadUser, q: string): boolean {
  if (!q) {
    return true;
  }
  const n = user.name.toLowerCase();
  const e = user.email.toLowerCase();
  const p = user.phone.toLowerCase();
  return n.includes(q) || e.includes(q) || p.includes(q);
}

const UsersListPage = () => {
  const { t } = useTranslation();
  const [rows] = useAtom(usersListAtom);
  const [status] = useAtom(usersListStatusAtom);
  const [error] = useAtom(usersListErrorAtom);
  const load = useAction(loadUsersList);

  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 220);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    const q = debouncedQuery.trim().toLowerCase();
    const roleNum =
      roleFilter !== null && roleFilter !== ""
        ? (Number(roleFilter) as UserRole)
        : null;

    return list.filter((u) => {
      if (roleNum !== null && Number(u.role) !== roleNum) {
        return false;
      }
      if (!matchesAccountStatus(u, statusFilter)) {
        return false;
      }
      return matchesSearch(u, q);
    });
  }, [rows, debouncedQuery, roleFilter, statusFilter]);

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
              setStatusFilter((v as StatusFilter) ?? "all");
            }}
            style={{ width: 200 }}
          />
          <Button variant="light" onClick={() => void load()}>
            {t(LANG_KEYS.pages.usersListRefresh)}
          </Button>
        </Group>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : (
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
                {filtered.length === 0 ? (
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
                  filtered.map((u) => {
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
        )}
      </Stack>
    </Container>
  );
};
UsersListPage.displayName = "UsersListPage";

export { UsersListPage };
