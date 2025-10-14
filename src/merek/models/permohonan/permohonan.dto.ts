import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDto {
  @IsOptional()
  @IsString()
  applicationDate?: string;

  @IsOptional()
  @IsString()
  applicationNoOnline?: string;

  @IsOptional()
  @IsString()
  eFilingNo?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  fileTypeDetailId?: string;

  @IsOptional()
  @IsString()
  classList?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;
}

export class ApplicantSearchDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SearchDto)
  search?: SearchDto;
}
