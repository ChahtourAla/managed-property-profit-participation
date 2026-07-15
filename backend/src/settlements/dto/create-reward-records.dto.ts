import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRewardRecordsDto {
  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description:
      'Legacy field. Ignored by backend. Easycoin party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;

  @ApiPropertyOptional({
    example: ['00f7c1...', '00a8d2...'],
    description:
      'Optional list of ProfitParticipationHolding Daml contract IDs. If omitted, backend creates reward records for all active holdings of the instrument.',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holdingCids?: string[];
}
