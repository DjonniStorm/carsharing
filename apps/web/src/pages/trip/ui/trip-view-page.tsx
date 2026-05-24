import { Alert, Button, Container, Group, Loader, Stack } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SendViolationNoticeModal } from "@/features/manager-violation-notice/ui/send-violation-notice-modal";
import { isCarEligibleForReturnWizard } from "@/features/cars/lib/car-return-to-service-present";
import { getYandexMapsApiKey } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes-paths";
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
    trip,
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
        ) : trip && car ? (
          <>
            <TripViewTripDetailsSection
              trip={trip}
              liveTrip={shownTrip ?? trip}
              t={t}
              userById={userById}
            />
            {isCarEligibleForReturnWizard(car) ? (
              <Alert
                color="orange"
                title={t(LANG_KEYS.pages.tripDetailCarReturnBannerTitle)}
              >
                <Stack gap="sm">
                  <span>{t(LANG_KEYS.pages.tripDetailCarReturnBannerBody)}</span>
                  <Link
                    to={ROUTES.dashboard.carReturnToService(car.id)}
                    style={{ textDecoration: "none", alignSelf: "flex-start" }}
                  >
                    <Button component="span" size="xs" color="teal">
                      {t(LANG_KEYS.pages.carsReturnToServiceButton)}
                    </Button>
                  </Link>
                </Stack>
              </Alert>
            ) : null}
            <TripViewCarSection car={car} />
            <TripViewViolationsSection
              violations={violations}
              canSendViolationNotice={canSendViolationNotice}
              onNotifyDriver={openViolationNotice}
            />
            <SendViolationNoticeModal
              opened={noticeOpened}
              onClose={closeViolationNotice}
              tripId={trip.id}
              violations={violations}
              onSent={() => {
                void loadEmailNotices();
              }}
            />
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
