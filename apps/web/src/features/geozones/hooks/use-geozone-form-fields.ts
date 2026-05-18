import { useCallback, useState } from "react";

import { GeozoneType } from "@/entities/geozone";
import { GEOZONE_FORM_DEFAULTS } from "@/features/geozones/lib/geozone-form-present";
import type { GeozoneEditHydration } from "@/features/geozones/model/geozone-edit-view";

export function useGeozoneFormFields() {
  const [name, setName] = useState("");
  const [type, setType] = useState<GeozoneType>(GEOZONE_FORM_DEFAULTS.type);
  const [color, setColor] = useState<string>(GEOZONE_FORM_DEFAULTS.color);
  const [rulesJson, setRulesJson] = useState("");

  const applyFromHydration = useCallback((hydration: GeozoneEditHydration) => {
    setName(hydration.meta.name);
    setType(hydration.meta.type);
    setColor(hydration.meta.color);
    setRulesJson(hydration.rulesJson);
  }, []);

  return {
    name,
    setName,
    type,
    setType,
    color,
    setColor,
    rulesJson,
    setRulesJson,
    applyFromHydration,
  };
}
