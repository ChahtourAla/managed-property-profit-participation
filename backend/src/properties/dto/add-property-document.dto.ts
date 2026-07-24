import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AddPropertyDocumentDto {
  @ApiProperty({
    example: 'Property valuation report',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: '/uploads/properties/PROP-001/valuation-report.pdf',
  })
  @IsString()
  url!: string;

  @ApiPropertyOptional({
    example: 'HASH-DOCUMENT-001',
  })
  @IsOptional()
  @IsString()
  documentHash?: string;
}
