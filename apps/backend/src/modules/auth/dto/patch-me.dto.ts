import { ApiProperty } from '@nestjs/swagger';
import { FIELD_LIMITS } from '@carsharing/validation';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class PatchMeDto {
  @ApiProperty({
    description: 'Отображаемое имя',
    maxLength: FIELD_LIMITS.USER_DISPLAY_NAME_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(FIELD_LIMITS.USER_DISPLAY_NAME_MIN)
  @MaxLength(FIELD_LIMITS.USER_DISPLAY_NAME_MAX)
  name!: string;
}
