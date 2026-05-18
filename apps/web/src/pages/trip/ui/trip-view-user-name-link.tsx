import { Anchor, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import type { ReadUser } from "@/entities/user";
import { ROUTES } from "@/shared/config/routes-paths";

type Props = {
  userId: string | null | undefined;
  userById: Map<string, ReadUser>;
};

export function TripViewUserNameLink({ userId, userById }: Props) {
  const id = userId?.trim() ?? "";
  if (!id) {
    return (
      <Text component="span" size="sm" c="dimmed">
        —
      </Text>
    );
  }
  const u = userById.get(id);
  if (u) {
    return (
      <Anchor
        component={Link}
        to={ROUTES.dashboard.userView(id)}
        size="sm"
        fw={500}
      >
        {u.name}
      </Anchor>
    );
  }
  return (
    <Text component="span" size="sm" ff="monospace">
      {id}
    </Text>
  );
}
