import {
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { wrap } from "@reatom/core";
import { useAction } from "@reatom/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ViolationRead } from "@/entities/violation";
import {
  VIOLATION_STATUSES_ORDERED,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import { managerViolationNoticeApi } from "@/features/manager-violation-notice/api";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { notification } from "@/shared/lib/notification";

type Props = {
  opened: boolean;
  onClose: () => void;
  tripId: string;
  violations: ViolationRead[];
  /** После успешной отправки (перезагрузка списка уведомлений на странице поездки). */
  onSent?: () => void;
};

const SendViolationNoticeModal = ({
  opened,
  onClose,
  tripId,
  violations,
  onSent,
}: Props) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!opened) {
      return;
    }
    const init: Record<string, boolean> = {};
    for (const v of violations) {
      init[v.id] = true;
    }
    setSelected(init);
    setSubject("");
    setMessage("");
  }, [opened, violations]);

  const selectedIds = useMemo(() => {
    return Object.entries(selected)
      .filter(([, checked]) => checked)
      .map(([id]) => id);
  }, [selected]);

  const handleSubmit = useAction(async () => {
    if (selectedIds.length === 0) {
      notification.warning(
        t(LANG_KEYS.pages.tripViolationNoticeWarnNoViolationsTitle),
        t(LANG_KEYS.pages.tripViolationNoticeWarnNoViolationsBody),
      );
      return;
    }
    const subj = subject.trim();
    const msg = message.trim();
    if (!subj) {
      notification.warning(
        t(LANG_KEYS.pages.tripViolationNoticeWarnSubjectTitle),
        t(LANG_KEYS.pages.tripViolationNoticeWarnSubjectBody),
      );
      return;
    }
    if (!msg) {
      notification.warning(
        t(LANG_KEYS.pages.tripViolationNoticeWarnMessageTitle),
        t(LANG_KEYS.pages.tripViolationNoticeWarnMessageBody),
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await wrap(
        managerViolationNoticeApi.sendManagerViolationNotice({
          tripId,
          violationIds: selectedIds,
          subject: subj,
          message: msg,
        }),
      );
      notification.success(
        t(LANG_KEYS.pages.tripViolationNoticeSuccessTitle),
        t(LANG_KEYS.pages.tripViolationNoticeSuccessBody, {
          email: res.sentToEmail,
          status: res.deliveryStatus,
        }),
      );
      onSent?.();
      onClose();
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : t(LANG_KEYS.pages.tripViolationNoticeErrorFallback);
      notification.error(t(LANG_KEYS.pages.tripViolationNoticeErrorTitle), msg);
    } finally {
      setSubmitting(false);
    }
  });

  const violationKindLabel = (v: ViolationRead): string => {
    const key = violationStatusLangKey(v.type);
    return VIOLATION_STATUSES_ORDERED.includes(v.type)
      ? t(key)
      : String(v.type);
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      title={t(LANG_KEYS.pages.tripViolationNoticeModalTitle)}
      size="lg"
      centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.pages.tripViolationNoticeIntro)}
        </Text>
        <ScrollArea.Autosize mah={280} type="auto">
          <Stack gap="xs">
            {violations.map((v) => (
              <Checkbox
                key={v.id}
                label={
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {violationKindLabel(v)}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {v.description}
                    </Text>
                    <Text size="xs" ff="monospace" c="dimmed">
                      {v.id}
                    </Text>
                  </Stack>
                }
                checked={selected[v.id] === true}
                onChange={() => {
                  setSelected((prev) => ({
                    ...prev,
                    [v.id]: !(prev[v.id] === true),
                  }));
                }}
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
        <TextInput
          label={t(LANG_KEYS.pages.tripViolationNoticeSubjectLabel)}
          placeholder={t(LANG_KEYS.pages.tripViolationNoticeSubjectPlaceholder)}
          value={subject}
          onChange={(e) => setSubject(e.currentTarget.value)}
          maxLength={500}
          required
        />
        <Textarea
          label={t(LANG_KEYS.pages.tripViolationNoticeMessageLabel)}
          placeholder={t(LANG_KEYS.pages.tripViolationNoticeMessagePlaceholder)}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          maxLength={20_000}
          autosize
          minRows={4}
          required
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            {t(LANG_KEYS.pages.tripViolationNoticeCancel)}
          </Button>
          <Button loading={submitting} onClick={() => void handleSubmit()}>
            {t(LANG_KEYS.pages.tripViolationNoticeSubmit)}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
SendViolationNoticeModal.displayName = "SendViolationNoticeModal";

export { SendViolationNoticeModal };
