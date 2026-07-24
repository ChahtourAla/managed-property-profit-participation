import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectUserDto {
  @ApiProperty({
    example: 'Missing identity verification document.',
    description: 'Reason why the user was rejected',
  })
  @IsString()
  reason!: string;
}
