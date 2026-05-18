import { Alert, Container, Group, Loader, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { SendViolationNoticeModal } from "@/features/manager-violation-notice/ui/send-violation-notice-modal";
import { getYandexMapsApiKey } from "@/shared/config/env";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useTripViewPage } from "@/pages/trip/hooks/use-trip-view-page";
import { TripViewCarSection } from "@/pages/trip/ui/trip-view-car-section";
import { TripViewEmailNoticesSection } from "@/pages/trip/ui/trip-view-email-notices-section";
import { TripViewHeader } from "@/pages/trip/ui/trip-view-header";
import { TripViewRouteMapSection } from "@/pages/trip/ui/trip-view-route-map-section";
import { TripViewTripDetailsSection } from "@/pages/trip/ui/trip-view-trip-details-section";
import { TripViewViolationsSection } from "@/pages/trip/ui/trip-view-violations-section";

const tripMapApiKey = getYandexMapsApiKey();

const TripViewPage = () => {
  const { t } = useTranslation();
  const {
    shownTrip,
    car,
    violations,
    violationById,
    routePoints,
    tripMapGeozone,
    loading,
    errorMessage,
    tripMapZoneLoading,
    canSendViolationNotice,
    noticeOpened,
    openViolationNotice,
    closeViolationNotice,
    loadEmailNotices,
    emailNotices,
    emailNoticesPhase,
    emailNoticesError,
    userById,
  } = useTripViewPage();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <TripViewHeader />

        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : errorMessage ? (
          <Alert color="red" title={t(LANG_KEYS.pages.tripDetailLoadError)}>
            {errorMessage}
          </Alert>
        ) : shownTrip && car ? (
          <>
            <TripViewTripDetailsSection
              trip={shownTrip}
              t={t}
              userById={userById}
            />
            <TripViewCarSection car={car} />
            <TripViewViolationsSection
              violations={violations}
              canSendViolationNotice={canSendViolationNotice}
              onNotifyDriver={openViolationNotice}
            />
            {violations.length > 0 ? (
              <SendViolationNoticeModal
                opened={noticeOpened}
                onClose={closeViolationNotice}
                tripId={shownTrip.id}
                violations={violations}
                onSent={() => {
                  void loadEmailNotices();
                }}
              />
            ) : null}
            <TripViewRouteMapSection
              apiKey={tripMapApiKey}
              points={routePoints}
              tripGeozone={tripMapGeozone}
              zoneLoading={tripMapZoneLoading}
            />
            <TripViewEmailNoticesSection
              phase={emailNoticesPhase}
              error={emailNoticesError}
              notices={emailNotices}
              violationById={violationById}
              userById={userById}
            />
          </>
        ) : null}
      </Stack>
    </Container>
  );
};
TripViewPage.displayName = "TripViewPage";

export { TripViewPage };
