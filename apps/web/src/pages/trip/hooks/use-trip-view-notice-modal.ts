import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "@reatom/react";

import { authUserAtom } from "@/features/auth/model/session";
import { UserRole } from "@/entities/user/model/user-role";

export function useTripViewNoticeModal() {
  const [authUser] = useAtom(authUserAtom);
  const [
    noticeOpened,
    { open: openViolationNotice, close: closeViolationNotice },
  ] = useDisclosure(false);

  const canSendViolationNotice =
    authUser != null &&
    (authUser.role === UserRole.MANAGER ||
      authUser.role === UserRole.SYSTEM_ADMIN);

  return {
    canSendViolationNotice,
    noticeOpened,
    openViolationNotice,
    closeViolationNotice,
  };
}
