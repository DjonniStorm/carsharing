import { z } from 'zod'

import { UserRole } from '@/entities/user/model/user-role'
import { LANG_KEYS } from '@/shared/i18n/keys'
import { translate } from '@/shared/i18n/translate'

const PHONE_E164 = /^\+[1-9]\d{1,14}$/

/** Как `LoginDto`: login ≥ 3, password непустой. */
export const loginSchema = z.object({
  login: z.string().superRefine((val, ctx) => {
    if (val.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: translate(LANG_KEYS.validation.loginMin),
      })
    }
  }),
  password: z.string().superRefine((val, ctx) => {
    if (val.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: translate(LANG_KEYS.validation.passwordRequired),
      })
    }
  }),
})

const refinePersonName = (val: string, ctx: z.RefinementCtx) => {
  if (val.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.validation.nameMin),
    })
  } else if (val.length > 255) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.validation.nameMax),
    })
  }
}

const refineEmail = (val: string, ctx: z.RefinementCtx) => {
  const parsed = z.string().email().safeParse(val)
  if (!parsed.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.validation.emailInvalid),
    })
  }
}

const refinePhone = (val: string, ctx: z.RefinementCtx) => {
  if (!PHONE_E164.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.validation.phoneE164),
    })
  }
}

const refineRegisterPassword = (val: string, ctx: z.RefinementCtx) => {
  if (val.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.validation.passwordMin),
    })
  } else if (val.length > 255) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.validation.passwordMax),
    })
  }
}

/** Тело `POST /auth/register` (`RegisterDto`). Роль не передаём — на бэкенде будет DRIVER. */
export const publicRegisterSchema = z.object({
  name: z.string().superRefine(refinePersonName),
  email: z.string().superRefine(refineEmail),
  phone: z.string().superRefine(refinePhone),
  password: z.string().superRefine(refineRegisterPassword),
})

/** Поля UI: те же поля + опциональная роль (показывается при `VITE_OPEN_MANAGER_SELF_REGISTER`). */
export const publicRegisterFormSchema = publicRegisterSchema
  .extend({
    role: z.nativeEnum(UserRole).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.role !== undefined &&
      data.role !== UserRole.MANAGER &&
      data.role !== UserRole.DRIVER
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: translate(LANG_KEYS.validation.roleAllowed),
      })
    }
  })

/** Как `CreateUserEntity` для `POST /users` (менеджер). */
export const createUserSchema = z.object({
  name: z.string().superRefine(refinePersonName),
  email: z.string().superRefine(refineEmail),
  phone: z.string().superRefine(refinePhone),
  password: z.string().superRefine(refineRegisterPassword),
  role: z.nativeEnum(UserRole),
})

export type LoginFormOutput = z.infer<typeof loginSchema>
export type PublicRegisterFormOutput = z.infer<typeof publicRegisterSchema>
export type RegisterFormOutput = z.infer<typeof publicRegisterFormSchema>
export type CreateUserFormOutput = z.infer<typeof createUserSchema>
