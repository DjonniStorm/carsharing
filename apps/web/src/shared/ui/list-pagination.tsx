import { Group, Pagination, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/shared/i18n/keys";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  onChange: (page: number) => void;
};

const ListPagination = ({
  page,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onChange,
}: Props) => {
  const { t } = useTranslation();

  if (totalItems === 0) {
    return null;
  }

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm" mt="md">
      <Text size="sm" c="dimmed">
        {t(LANG_KEYS.common.paginationRange, {
          from: rangeStart,
          to: rangeEnd,
          total: totalItems,
        })}
      </Text>
      {totalPages > 1 ? (
        <Pagination value={page} onChange={onChange} total={totalPages} />
      ) : null}
    </Group>
  );
};
ListPagination.displayName = "ListPagination";

export { ListPagination };
