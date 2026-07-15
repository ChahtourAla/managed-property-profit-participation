import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectContractDto {
  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description:
      'Legacy field. Ignored by backend. Easycoin party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;

  @ApiProperty({
    example: 'The submitted contract data is incomplete.',
    description: 'Reason for rejecting the owner draft',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
