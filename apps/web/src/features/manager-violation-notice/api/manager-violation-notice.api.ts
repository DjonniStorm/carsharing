import type {
  ManagerViolationNoticeRead,
  ManagerViolationNoticeSendBody,
  TripNotificationRead,
} from "@/entities/manager-violation-notice";
import { BaseApiClient } from "@/shared/api";
import type { AccessTokenGetter } from "@/shared/api/base-api-client";

export class ManagerViolationNoticeApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  sendManagerViolationNotice(
    body: ManagerViolationNoticeSendBody,
  ): Promise<ManagerViolationNoticeRead> {
    return this.postJson<ManagerViolationNoticeRead>(
      "/notifications/manager/violation-notice",
      body,
    );
  }

  listTripNotifications(tripId: string): Promise<TripNotificationRead[]> {
    const id = encodeURIComponent(tripId);
    return this.getJson<TripNotificationRead[]>(`/notifications/trip/${id}`);
  }
}
