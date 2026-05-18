import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";

export function useDebouncedSearch(debounceMs = 220) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, debounceMs);

  return { query, setQuery, debouncedQuery };
}
