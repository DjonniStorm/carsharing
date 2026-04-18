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
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(255, { message: 'Name must be at most 255 characters long' })
  name: string;

  @IsEmail(undefined, { message: 'Email is not valid' })
  @IsNotEmpty({ message: 'Email is required and cannot be empty' })
  email: string;

  @IsString({ message: 'Phone is required and must be a string' })
  @IsNotEmpty({ message: 'Phone is required and cannot be empty' })
  @Matches(PHONE_REGEX, { message: 'Phone is not valid' })
  phone: string;

  @IsString({ message: 'Password is required and must be a string' })
  @IsNotEmpty({ message: 'Password is required and cannot be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password must be at most 255 characters long' })
  password: string;

  @IsEnum(UserRole, { message: 'Role is not valid' })
  @IsNotEmpty({ message: 'Role is required and cannot be empty' })
  role: UserRole;
}
