export type ManagerNoticeDeliveryStatus = "PENDING" | "SENT" | "FAILED";

export type ManagerViolationNoticeRead = {
  notificationId: number;
  deliveryStatus: ManagerNoticeDeliveryStatus;
  violationIds: string[];
  sentToEmail: string;
  failureReason?: string;
};

export type ManagerViolationNoticeSendBody = {
  tripId: string;
  violationIds: string[];
  subject: string;
  message: string;
};

export type TripNotificationRead = {
  id: number;
  userId: string;
  tripId: string | null;
  message: string;
  status: string;
  violationIds: string[];
};
