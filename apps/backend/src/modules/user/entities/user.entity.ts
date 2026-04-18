import { validate } from 'uuid';

import { EMAIL_REGEX, PHONE_REGEX } from 'src/shared/regexp/email';
import { BaseEntity } from 'src/shared/types/entities/base-entity';
import { EmailError } from 'src/shared/types/errors/email.error';
import { EmptyFieldError } from 'src/shared/types/errors/empty-field.error';
import { IdError } from 'src/shared/types/errors/id.error';
import { PhoneError } from 'src/shared/types/errors/phone.error';
import { UsernameError } from 'src/shared/types/errors/username.error';
import { UserRole } from './user.role';

export class UserEntity extends BaseEntity<string> {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public phone: string,
    public passwordHash: string,
    public role: UserRole,
    public isActive: boolean = false,
    public isDeleted: boolean = false,
  ) {
    super(id);
    UserEntity.validate(this);
  }

  static validate(user: UserEntity): void {
    if (!user.id) {
      throw new IdError(`Id is required`);
    }
    if (!validate(user.id)) {
      throw new IdError(`Id is not UUID`);
    }
    if (!user.name) {
      throw new UsernameError(`Name is required`);
    }
    if (!user.name.trim()) {
      throw new UsernameError(`Name is required and cannot be empty`);
    }
    if (!user.email) {
      throw new EmailError(`Email is required`);
    }
    if (!user.email.trim()) {
      throw new EmailError(`Email is required and cannot be empty`);
    }
    if (!user.email.match(EMAIL_REGEX)) {
      throw new EmailError(`Email is not valid`);
    }
    if (!user.phone) {
      throw new PhoneError(`Phone is required`);
    }
    if (!user.phone.trim()) {
      throw new PhoneError(`Phone is required and cannot be empty`);
    }
    if (!user.phone.match(PHONE_REGEX)) {
      throw new PhoneError(`Phone is not valid`);
    }
    if (!user.passwordHash || !user.passwordHash.trim()) {
      throw new EmptyFieldError(`field password hash is required`);
    }
    if (!Object.values(UserRole).includes(user.role)) {
      throw new EmptyFieldError(`Role is not valid`);
    }
  }
}
