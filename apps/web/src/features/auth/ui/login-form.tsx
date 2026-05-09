import {
  Anchor,
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

import { loginSchema, type LoginFormOutput } from "@/entities/auth";
import { authApi } from "@/features/auth/api";
import { applyAccessToken } from "@/features/auth/model/session";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { safeInternalPath } from "@/shared/lib/navigation/safe-internal-path";
import { notification } from "@/shared/lib/notification";

export const LoginFormView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
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
      const nextPath = safeInternalPath(redirect, ROUTES.home);
      navigate({ to: nextPath });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t(LANG_KEYS.auth.notifyLoginErrorFallback);
      notification.error(t(LANG_KEYS.auth.notifyLoginErrorTitle), msg);
    }
  });

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Title order={2}>{t(LANG_KEYS.auth.loginTitle)}</Title>
        <TextInput
          label={t(LANG_KEYS.auth.loginField)}
          placeholder={t(LANG_KEYS.auth.loginPlaceholder)}
          autoComplete="username"
          key={form.key("login")}
          {...form.getInputProps("login")}
        />
        <PasswordInput
          label={t(LANG_KEYS.auth.password)}
          autoComplete="current-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" loading={form.submitting}>
          {t(LANG_KEYS.auth.submitLogin)}
        </Button>
        <Text size="sm">
          {t(LANG_KEYS.auth.noAccount)}{" "}
          <Anchor
            component={Link}
            to={ROUTES.register}
            search={redirect ? { redirect } : {}}
          >
            {t(LANG_KEYS.shell.register)}
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
};
LoginFormView.displayName = "LoginFormView";
