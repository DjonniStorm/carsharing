import { useDebouncedValue } from "@mantine/hooks";
import { useCallback, useState, type SetStateAction } from "react";

import { FIELD_LIMITS } from "@carsharing/validation";

const limitSearchQuery = (value: string): string =>
  value.slice(0, FIELD_LIMITS.SEARCH_QUERY_MAX);

export function useDebouncedSearch(debounceMs = 220) {
  const [query, setRawQuery] = useState("");
  const setQuery = useCallback((next: SetStateAction<string>) => {
    setRawQuery((current) => {
      const nextValue = typeof next === "function" ? next(current) : next;
      return limitSearchQuery(nextValue);
    });
  }, []);
  const [debouncedQuery] = useDebouncedValue(query, debounceMs);

  return {
    query,
    setQuery,
    debouncedQuery,
    maxLength: FIELD_LIMITS.SEARCH_QUERY_MAX,
  };
}
