export type FirebasePhoneConfig = {
  apiKey: string;
};

export type FirebaseRecaptchaParams = {
  recaptchaSiteKey: string;
};

export type SendFirebasePhoneVerificationResult = {
  sessionInfo: string;
};

export type VerifyFirebasePhoneCodeResult = {
  idToken: string;
  phoneNumber: string;
};

const IDENTITY_TOOLKIT_BASE = 'https://identitytoolkit.googleapis.com/v1';

type FirebaseErrorBody = {
  error?: {
    message?: string;
    code?: number;
  };
};

async function parseFirebaseError(res: Response): Promise<string> {
  const snippet = await res.text().catch(() => '');
  try {
    const parsed = JSON.parse(snippet) as FirebaseErrorBody;
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // ignore JSON parse failure
  }
  return snippet.slice(0, 500) || `HTTP ${res.status}`;
}

function assertE164Phone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed.startsWith('+')) {
    throw new Error('Номер телефона должен быть в формате E.164, например +79991234567');
  }
  return trimmed;
}

function assertRecaptchaToken(recaptchaToken: string): string {
  const trimmed = recaptchaToken.trim();
  if (!trimmed) {
    throw new Error('recaptchaToken не может быть пустым');
  }
  return trimmed;
}

/** Параметры reCAPTCHA для Firebase Phone Auth (site key для виджета на клиенте). */
export async function getFirebaseRecaptchaParams(
  config: FirebasePhoneConfig,
): Promise<FirebaseRecaptchaParams> {
  const url = `${IDENTITY_TOOLKIT_BASE}/recaptchaParams?key=${encodeURIComponent(config.apiKey)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const message = await parseFirebaseError(res);
    throw new Error(`Firebase recaptchaParams (${res.status}): ${message}`);
  }

  const data = (await res.json()) as { recaptchaSiteKey?: string };
  const recaptchaSiteKey = data.recaptchaSiteKey?.trim();
  if (!recaptchaSiteKey) {
    throw new Error('Firebase recaptchaParams: пустой recaptchaSiteKey в ответе');
  }

  return { recaptchaSiteKey };
}

/**
 * Отправка SMS-кода через Firebase Phone Auth (Identity Toolkit REST + reCAPTCHA).
 * Код генерирует Firebase; для проверки нужен {@link verifyFirebasePhoneCode}.
 */
export async function sendFirebasePhoneVerification(
  config: FirebasePhoneConfig,
  phone: string,
  recaptchaToken: string,
): Promise<SendFirebasePhoneVerificationResult> {
  const phoneNumber = assertE164Phone(phone);
  const token = assertRecaptchaToken(recaptchaToken);
  const url = `${IDENTITY_TOOLKIT_BASE}/accounts:sendVerificationCode?key=${encodeURIComponent(config.apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber,
      recaptchaToken: token,
    }),
  });

  if (!res.ok) {
    const message = await parseFirebaseError(res);
    throw new Error(`Firebase sendVerificationCode (${res.status}): ${message}`);
  }

  const data = (await res.json()) as { sessionInfo?: string };
  if (!data.sessionInfo?.trim()) {
    throw new Error('Firebase sendVerificationCode: пустой sessionInfo в ответе');
  }

  return { sessionInfo: data.sessionInfo };
}

/**
 * Проверка кода из SMS Firebase Phone Auth.
 */
export async function verifyFirebasePhoneCode(
  config: FirebasePhoneConfig,
  sessionInfo: string,
  code: string,
): Promise<VerifyFirebasePhoneCodeResult> {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    throw new Error('Код подтверждения не может быть пустым');
  }
  if (!sessionInfo.trim()) {
    throw new Error('sessionInfo не может быть пустым');
  }

  const url = `${IDENTITY_TOOLKIT_BASE}/accounts:signInWithPhoneNumber?key=${encodeURIComponent(config.apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionInfo: sessionInfo.trim(),
      code: trimmedCode,
    }),
  });

  if (!res.ok) {
    const message = await parseFirebaseError(res);
    throw new Error(`Firebase signInWithPhoneNumber (${res.status}): ${message}`);
  }

  const data = (await res.json()) as { idToken?: string; phoneNumber?: string };
  if (!data.idToken?.trim()) {
    throw new Error('Firebase signInWithPhoneNumber: пустой idToken в ответе');
  }

  return {
    idToken: data.idToken,
    phoneNumber: data.phoneNumber?.trim() ?? '',
  };
}
