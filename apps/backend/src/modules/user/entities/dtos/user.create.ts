import { FIELD_LIMITS } from '@carsharing/validation';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PHONE_REGEX } from 'src/shared/regexp/email';
import { UserRole } from '../user.role';

export class CreateUserEntity {
  @IsString({ message: 'Name is required and must be a string' })
  @IsNotEmpty({ message: 'Name is required and cannot be empty' })
  @MinLength(FIELD_LIMITS.USER_DISPLAY_NAME_MIN, {
    message: 'Name must be at least 3 characters long',
  })
  @MaxLength(FIELD_LIMITS.USER_DISPLAY_NAME_MAX, {
    message: 'Name must be at most 120 characters long',
  })
  name: string;

  @IsEmail(undefined, { message: 'Email is not valid' })
  @IsNotEmpty({ message: 'Email is required and cannot be empty' })
  @MaxLength(FIELD_LIMITS.EMAIL_MAX)
  email: string;

  @IsString({ message: 'Phone is required and must be a string' })
  @IsNotEmpty({ message: 'Phone is required and cannot be empty' })
  @MaxLength(FIELD_LIMITS.PHONE_MAX)
  @Matches(PHONE_REGEX, { message: 'Phone is not valid' })
  phone: string;

  @IsString({ message: 'Password is required and must be a string' })
  @IsNotEmpty({ message: 'Password is required and cannot be empty' })
  @MinLength(FIELD_LIMITS.USER_PASSWORD_MIN, {
    message: 'Password must be at least 8 characters long',
  })
  @MaxLength(FIELD_LIMITS.USER_PASSWORD_MAX, {
    message: 'Password must be at most 255 characters long',
  })
  password: string;

  @IsEnum(UserRole, { message: 'Role is not valid' })
  @IsNotEmpty({ message: 'Role is required and cannot be empty' })
  role: UserRole;
}
