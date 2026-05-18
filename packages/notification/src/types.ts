/**
 * Конфигурация каналов уведомлений. Секреты и URL задаёт приложение (например Nest при старте),
 * библиотека их не читает из окружения.
 */
export type NotificationConfig = {
  /** SMTP; если отсутствует — {@link NotificationClient.sendEmail} недоступен. */
  email?: SmtpConfig;
  /** HTTP SMS; если отсутствует — {@link NotificationClient.sendSms} недоступен. */
  sms?: HttpSmsConfig;
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

/**
 * Универсальная отправка SMS через HTTP.
 * В строках допускаются плейсхолдеры `{{to}}` и `{{body}}` (номер и текст сообщения).
 */
export type HttpSmsConfig = {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  /**
   * Тело POST как JSON: объект/массив с вложенными строками — подстановка рекурсивная.
   * Для GET не используется.
   */
  jsonBody?: JsonWithPlaceholders;
  /** Параметры query (после подстановки добавляются к `url`). */
  searchParams?: Record<string, string>;
};

/** JSON-совместимое значение, в строках которого могут быть `{{to}}` и `{{body}}`. */
export type JsonWithPlaceholders =
  | string
  | number
  | boolean
  | null
  | JsonWithPlaceholders[]
  | { [key: string]: JsonWithPlaceholders };

export type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type SendSmsInput = {
  /** Номер или идентификатор получателя в формате, который ожидает ваш SMS API. */
  to: string;
  body: string;
};

/** Отправка кода подтверждения: SMS если настроен канал и передан `phone`, иначе email по `email`. */
export type SendVerificationCodeInput = {
  code: string;
  /** Номер для SMS (формат ожидает ваш SMS-провайдер). */
  phone?: string;
  /** Адрес для письма с кодом. */
  email?: string;
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
  sendSms(input: SendSmsInput): Promise<void>;
  /**
   * Код подтверждения: при наличии SMS и `phone` — SMS; иначе при наличии SMTP и `email` — письмо.
   * Если ни один канал не подходит — ошибка с текстом, что задать в конфиге/аргументах.
   */
  sendVerificationCode(input: SendVerificationCodeInput): Promise<void>;
  /**
   * Уведомление о нарушении — только email. Требуется настроенный SMTP.
   */
  sendViolationNotice(input: ViolationNoticeInput): Promise<void>;
};
