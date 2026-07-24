import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddPropertyImageDto {
  @ApiProperty({
    example: '/uploads/properties/PROP-001/living-room.jpg',
    description: 'Image URL or relative file path',
  })
  @IsString()
  url!: string;

  @ApiPropertyOptional({
    example: 'Living room',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
