import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRewardRecordsDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  /**
   * Optional.
   * If not provided, the backend will automatically find
   * all active ProfitParticipationHolding contracts for the instrument.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holdingCids?: string[];
}
