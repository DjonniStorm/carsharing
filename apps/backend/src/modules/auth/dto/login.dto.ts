import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email или телефон в формате E.164',
    example: 'driver@example.com',
  })
  @IsString()
  @MinLength(3)
  login!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;
}
