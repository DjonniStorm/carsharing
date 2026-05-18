import { useViolationEditLoad } from "@/pages/violations/hooks/use-violation-edit-load";
import { useViolationEditMutations } from "@/pages/violations/hooks/use-violation-edit-mutations";

export function useViolationEditPage() {
  const load = useViolationEditLoad();
  const mutations = useViolationEditMutations(load);

  return {
    ...load,
    ...mutations,
  };
}
