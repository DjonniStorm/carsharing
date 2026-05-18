import { useTariffEditLoad } from "@/pages/tariffs/hooks/use-tariff-edit-load";
import { useTariffEditMutations } from "@/pages/tariffs/hooks/use-tariff-edit-mutations";

export function useTariffEditPage() {
  const load = useTariffEditLoad();
  const mutations = useTariffEditMutations(load);

  return {
    ...load,
    ...mutations,
  };
}
