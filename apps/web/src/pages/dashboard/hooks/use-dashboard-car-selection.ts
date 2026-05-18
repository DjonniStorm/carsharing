import { useMemo, useState } from "react";

import { stripWidth, panelWidth } from "@/pages/dashboard/ui/dashboard-selected-car-panel";

const OVERLAY_EDGE_PX = 16;

export function useDashboardCarSelection() {
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [carPanelExpanded, setCarPanelExpanded] = useState(true);

  const overlayRightPx = useMemo(() => {
    if (!selectedCarId) {
      return OVERLAY_EDGE_PX;
    }
    return OVERLAY_EDGE_PX + (carPanelExpanded ? panelWidth : stripWidth);
  }, [selectedCarId, carPanelExpanded]);

  const selectCar = (carId: string) => {
    setSelectedCarId(carId);
    setCarPanelExpanded(true);
  };

  const clearSelection = () => {
    setSelectedCarId(null);
  };

  return {
    selectedCarId,
    carPanelExpanded,
    setCarPanelExpanded,
    overlayRightPx,
    selectCar,
    clearSelection,
  };
}
