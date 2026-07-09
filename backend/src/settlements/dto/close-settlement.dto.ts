import { IsOptional, IsString } from 'class-validator';

export class CloseSettlementDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsString()
  closureNote: string;
}
