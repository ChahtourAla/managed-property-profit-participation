import { IsOptional, IsString } from 'class-validator';

export class RedeemHoldingDto {
  @IsString()
  holdingCid: string;

  @IsString()
  burnReference: string;

  @IsOptional()
  @IsString()
  easycoin?: string;
}
