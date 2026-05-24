export { createNotificationClient } from './client.js';
export {
  getFirebaseRecaptchaParams,
  sendFirebasePhoneVerification,
  verifyFirebasePhoneCode,
} from './firebase-phone.js';
export { buildVerificationEmail } from './templates/verification-templates.js';
export { buildViolationNoticeEmail } from './templates/violation-templates.js';
export { violationTitleFromKind } from './violation-kind-labels.js';
export type {
  FirebasePhoneConfig,
  FirebaseRecaptchaParams,
  SendFirebasePhoneVerificationResult,
  VerifyFirebasePhoneCodeResult,
} from './firebase-phone.js';
export type {
  NotificationClient,
  NotificationConfig,
  SendEmailInput,
  SendVerificationCodeInput,
  SmtpConfig,
  ViolationNoticeFields,
  ViolationNoticeInput,
} from './types.js';
