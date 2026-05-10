import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PatchMeDto {
  @ApiProperty({ description: 'Отображаемое имя' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
