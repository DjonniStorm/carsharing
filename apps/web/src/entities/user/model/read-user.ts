import type { UserRole } from "@/entities/user/model/user-role";

/** Ответ API после создания / чтения пользователя (без секретов). */
export type ReadUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive?: boolean;
  isDeleted?: boolean;
};
