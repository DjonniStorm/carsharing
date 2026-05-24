import type {
  FirebasePhoneConfig,
  SendFirebasePhoneVerificationResult,
  VerifyFirebasePhoneCodeResult,
} from './firebase-phone.js';

export type { FirebasePhoneConfig, SendFirebasePhoneVerificationResult, VerifyFirebasePhoneCodeResult };

/**
 * Конфигурация каналов уведомлений. Секреты задаёт приложение (например Nest при старте),
 * библиотека их не читает из окружения.
 */
export type NotificationConfig = {
  /** SMTP; если отсутствует — {@link NotificationClient.sendEmail} недоступен. */
  email?: SmtpConfig;
  /** Firebase Phone Auth; если отсутствует — SMS-методы недоступны. */
  firebasePhone?: FirebasePhoneConfig;
};

/** Параметры SMTP (nodemailer). */
export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  /** Значение заголовка From по умолчанию. */
  from: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

/** Отправка кода подтверждения на email (SMTP). */
export type SendVerificationCodeInput = {
  code: string;
  email: string;
};

/** Поля письма о нарушении (без адреса). */
export type ViolationNoticeFields = {
  title: string;
  description: string;
  tripId?: string;
  occurredAt?: Date;
  /**
   * Сводка по нарушениям в этом письме: всего штук и сколько по каждому типу (`kind` как в БД).
   * Если задано — в шаблоне показывается отдельный блок с агрегацией.
   */
  violationSummary?: {
    total: number;
    byKind: Array<{ kind: number; count: number }>;
  };
};

export type ViolationNoticeInput = ViolationNoticeFields & {
  /** Получатель — только email (уведомления о нарушениях пока через почту). */
  to: string;
};

/**
 * Клиент отправки уведомлений. Создаётся через {@link createNotificationClient}.
 */
export type NotificationClient = {
  sendEmail(input: SendEmailInput): Promise<void>;
  /** Код подтверждения на email (SMTP). */
  sendVerificationCode(input: SendVerificationCodeInput): Promise<void>;
  /** Параметры reCAPTCHA (site key) для SMS через Firebase Phone Auth. */
  getFirebaseRecaptchaParams(): Promise<{ recaptchaSiteKey: string }>;
  /**
   * SMS через Firebase Phone Auth. Код генерирует Firebase; возвращает sessionInfo для verify.
   */
  sendFirebasePhoneVerification(
    phone: string,
    recaptchaToken: string,
  ): Promise<SendFirebasePhoneVerificationResult>;
  /** Проверка кода из Firebase SMS. */
  verifyFirebasePhoneCode(
    sessionInfo: string,
    code: string,
  ): Promise<VerifyFirebasePhoneCodeResult>;
  /** Уведомление о нарушении — только email. Требуется настроенный SMTP. */
  sendViolationNotice(input: ViolationNoticeInput): Promise<void>;
};
