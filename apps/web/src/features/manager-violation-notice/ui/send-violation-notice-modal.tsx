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
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { FIELD_LIMITS } from "@carsharing/validation";

import type { ViolationRead } from "@/entities/violation";
import { parseViolationNoticeForm } from "@/features/manager-violation-notice/lib/violation-notice-form-schema";
import {
  VIOLATION_STATUSES_ORDERED,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import { managerViolationNoticeApi } from "@/features/manager-violation-notice/api";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { notifyApiError } from "@/shared/lib/notify-api-error";
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
  const [snapshotViolations, setSnapshotViolations] = useState<ViolationRead[]>(
    [],
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const prevOpenedRef = useRef(false);

  useEffect(() => {
    if (opened && !prevOpenedRef.current) {
      const init: Record<string, boolean> = {};
      for (const v of violations) {
        init[v.id] = true;
      }
      setSnapshotViolations([...violations]);
      setSelected(init);
      setSubject("");
      setMessage("");
    }
    prevOpenedRef.current = opened;
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
    const noticeParsed = parseViolationNoticeForm({ subject, message });
    if (!noticeParsed.success) {
      notification.warning(
        t(LANG_KEYS.pages.tripViolationNoticeWarnSubjectTitle),
        noticeParsed.error.issues[0]?.message ??
          t(LANG_KEYS.pages.tripViolationNoticeWarnMessageBody),
      );
      return;
    }
    const subj = noticeParsed.data.subject;
    const msg = noticeParsed.data.message;
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
      notifyApiError(LANG_KEYS.pages.tripViolationNoticeErrorTitle, e, {
        fallbackKey: LANG_KEYS.pages.tripViolationNoticeErrorFallback,
      });
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
            {snapshotViolations.map((v) => (
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
          minLength={FIELD_LIMITS.NOTICE_SUBJECT_MIN}
          maxLength={FIELD_LIMITS.NOTICE_SUBJECT_MAX}
          required
        />
        <Textarea
          label={t(LANG_KEYS.pages.tripViolationNoticeMessageLabel)}
          placeholder={t(LANG_KEYS.pages.tripViolationNoticeMessagePlaceholder)}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          minLength={FIELD_LIMITS.NOTICE_MESSAGE_MIN}
          maxLength={FIELD_LIMITS.NOTICE_MESSAGE_MAX}
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
