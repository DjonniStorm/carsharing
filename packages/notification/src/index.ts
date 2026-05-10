export { createNotificationClient } from './client.js';
export { substitutePlaceholders } from './placeholders.js';
export type { PlaceholderVars } from './placeholders.js';
export { buildVerificationEmail } from './templates/verification-templates.js';
export { buildViolationNoticeEmail } from './templates/violation-templates.js';
export { violationTitleFromKind } from './violation-kind-labels.js';
export type {
  HttpSmsConfig,
  JsonWithPlaceholders,
  NotificationClient,
  NotificationConfig,
  SendEmailInput,
  SendSmsInput,
  SendVerificationCodeInput,
  SmtpConfig,
  ViolationNoticeFields,
  ViolationNoticeInput,
} from './types.js';
