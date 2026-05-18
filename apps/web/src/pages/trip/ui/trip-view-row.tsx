import { Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

export function TripViewRow({
  label,
  value,
  valueFw = 500,
}: {
  label: string;
  value: ReactNode;
  valueFw?: number;
}) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed" style={{ flex: "0 1 auto" }}>
        {label}
      </Text>
      {isEmpty ? (
        <Text size="sm" ta="right">
          —
        </Text>
      ) : typeof value === "string" || typeof value === "number" ? (
        <Text
          size="sm"
          fw={valueFw}
          ta="right"
          style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
        >
          {value}
        </Text>
      ) : (
        <Group
          justify="flex-end"
          wrap="wrap"
          gap={4}
          style={{ flex: "1 1 auto", minWidth: 0 }}
        >
          {value}
        </Group>
      )}
    </Group>
  );
}

export function tripEmailNoticeBadgeColor(status: string): string {
  const s = (status || "").toUpperCase();
  if (s === "SENT") {
    return "green";
  }
  if (s === "FAILED") {
    return "red";
  }
  if (s === "PENDING") {
    return "yellow";
  }
  return "gray";
}
