import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInstrumentDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsString()
  contractId: string;

  @IsString()
  instrumentId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalUnits: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  nominalValuePerUnit: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  investorUpfrontPricePerUnit: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  approvedInvestors: string[];
}
