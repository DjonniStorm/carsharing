export function optionalQuery(
  params: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") {
      sp.set(k, v);
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}
