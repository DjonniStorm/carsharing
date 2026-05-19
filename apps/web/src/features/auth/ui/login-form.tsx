import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { wrap } from "@reatom/core";
import { useForm, schemaResolver } from "@mantine/form";
import { useAction } from "@reatom/react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { FIELD_LIMITS } from "@carsharing/validation";

import { loginSchema, type LoginFormOutput } from "@/entities/auth";
import { authApi } from "@/features/auth/api";
import { applyAccessToken } from "@/features/auth/model/session";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { safeInternalPath } from "@/shared/lib/navigation/safe-internal-path";
import { notifyApiError } from "@/shared/lib/notify-api-error";
import { notification } from "@/shared/lib/notification";

export const LoginFormView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect, reason } = useSearch({ from: "/login" });
  const applyToken = useAction(applyAccessToken);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      login: "",
      password: "",
    },
    validate: schemaResolver(loginSchema),
  });

  const handleSubmit = useAction(async (values: LoginFormOutput) => {
    try {
      const result = await wrap(authApi.login(values));
      applyToken(result.access_token);
      notification.success(
        t(LANG_KEYS.auth.notifyLoginSuccessTitle),
        t(LANG_KEYS.auth.notifyLoginSuccessBody),
      );
      const nextPath = safeInternalPath(redirect, ROUTES.dashboard.overview);
      navigate({ to: nextPath });
    } catch (err: unknown) {
      notifyApiError(LANG_KEYS.auth.notifyLoginErrorTitle, err, {
        fallbackKey: LANG_KEYS.auth.notifyLoginErrorFallback,
      });
    }
  });

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Title order={2}>{t(LANG_KEYS.auth.loginTitle)}</Title>
        {reason === "manager_only" ? (
          <Alert color="orange" title={t(LANG_KEYS.auth.managerOnlyWebTitle)}>
            {t(LANG_KEYS.auth.managerOnlyWebPanel)}
          </Alert>
        ) : null}
        <TextInput
          label={t(LANG_KEYS.auth.loginField)}
          placeholder={t(LANG_KEYS.auth.loginPlaceholder)}
          autoComplete="username"
          minLength={FIELD_LIMITS.LOGIN_MIN}
          maxLength={FIELD_LIMITS.LOGIN_MAX}
          key={form.key("login")}
          {...form.getInputProps("login")}
        />
        <PasswordInput
          label={t(LANG_KEYS.auth.password)}
          autoComplete="current-password"
          maxLength={FIELD_LIMITS.USER_PASSWORD_MAX}
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" loading={form.submitting}>
          {t(LANG_KEYS.auth.submitLogin)}
        </Button>
        <Text size="sm">
          {t(LANG_KEYS.auth.noAccount)}{" "}
          <Link
            to={ROUTES.register}
            search={{ redirect: redirect !== undefined ? redirect : undefined }}
          >
            <Text
              component="span"
              inherit
              td="underline"
              c="var(--mantine-color-anchor)"
            >
              {t(LANG_KEYS.shell.register)}
            </Text>
          </Link>
        </Text>
      </Stack>
    </form>
  );
};
LoginFormView.displayName = "LoginFormView";
