import { wrap } from "@reatom/core";
import {
  Anchor,
  Button,
  PasswordInput,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { useAction } from "@reatom/react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { PublicRegisterBody, RegisterFormOutput } from "@/entities/auth";
import { publicRegisterFormSchema } from "@/entities/auth";
import { UserRole } from "@/entities/user";
import { authApi } from "@/features/auth/api";
import { applyAccessToken } from "@/features/auth/model/session";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { safeInternalPath } from "@/shared/lib/navigation/safe-internal-path";
import { notification } from "@/shared/lib/notification";

const OPEN_MANAGER_SELF_REGISTER =
  import.meta.env.VITE_OPEN_MANAGER_SELF_REGISTER === "true";

export const RegisterFormView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/register" });
  const applyToken = useAction(applyAccessToken);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: UserRole.DRIVER,
    },
    validate: schemaResolver(publicRegisterFormSchema),
  });

  const handleSubmit = useAction(async (values: RegisterFormOutput) => {
    try {
      const { role, ...rest } = values;
      const body: PublicRegisterBody = { ...rest };
      if (OPEN_MANAGER_SELF_REGISTER && role !== undefined) {
        body.role = role;
      }
      const result = await wrap(authApi.register(body));
      applyToken(result.access_token);
      notification.success(
        t(LANG_KEYS.auth.notifyRegisterSuccessTitle),
        t(LANG_KEYS.auth.notifyRegisterSuccessBody),
      );
      const nextPath = safeInternalPath(redirect, ROUTES.dashboard.overview);
      navigate({ to: nextPath });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t(LANG_KEYS.auth.notifyRegisterErrorFallback);
      notification.error(t(LANG_KEYS.auth.notifyRegisterErrorTitle), msg);
    }
  });

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Title order={2}>{t(LANG_KEYS.auth.registerTitle)}</Title>
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.auth.registerHintBefore)}{" "}
          <code>POST /auth/register</code>.{" "}
          {t(LANG_KEYS.auth.registerHintAfter)}
        </Text>
        <TextInput
          label={t(LANG_KEYS.auth.name)}
          placeholder={t(LANG_KEYS.auth.namePlaceholder)}
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <TextInput
          label={t(LANG_KEYS.auth.email)}
          placeholder={t(LANG_KEYS.auth.emailPlaceholder)}
          type="email"
          autoComplete="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <TextInput
          label={t(LANG_KEYS.auth.phone)}
          placeholder={t(LANG_KEYS.auth.phonePlaceholder)}
          autoComplete="tel"
          key={form.key("phone")}
          {...form.getInputProps("phone")}
        />
        <PasswordInput
          label={t(LANG_KEYS.auth.password)}
          autoComplete="new-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        {OPEN_MANAGER_SELF_REGISTER ? (
          <Radio.Group
            label={t(LANG_KEYS.auth.role)}
            key={form.key("role")}
            {...form.getInputProps("role", { type: "radio" })}
          >
            <Stack gap="xs" mt="xs">
              <Radio
                value={UserRole.MANAGER}
                label={t(LANG_KEYS.auth.roleManager)}
              />
              <Radio
                value={UserRole.DRIVER}
                label={t(LANG_KEYS.auth.roleDriver)}
              />
            </Stack>
          </Radio.Group>
        ) : null}
        <Button type="submit" loading={form.submitting}>
          {t(LANG_KEYS.auth.submitRegister)}
        </Button>
        <Text size="sm">
          {t(LANG_KEYS.auth.hasAccount)}{" "}
          <Anchor
            component={Link}
            to={ROUTES.login}
            search={redirect ? { redirect } : {}}
          >
            {t(LANG_KEYS.shell.login)}
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
};
RegisterFormView.displayName = "RegisterFormView";
