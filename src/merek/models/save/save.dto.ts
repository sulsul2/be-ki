import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

class MFileDetailDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class SaveGeneralDto {
  @IsString()
  @IsNotEmpty()
  appid: string;

  @IsString()
  @IsNotEmpty()
  law: string;

  @IsString()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  applicationDate: string;

  @IsString()
  paymentDate: string;

  @IsObject()
  @ValidateNested()
  @Type(() => MFileDetailDto)
  mFileSequence: MFileDetailDto;

  @IsObject()
  @ValidateNested()
  @Type(() => MFileDetailDto)
  mFileType: MFileDetailDto;

  @IsObject()
  @ValidateNested()
  @Type(() => MFileDetailDto)
  mFileTypeDetail: MFileDetailDto;

  @IsString()
  @IsNotEmpty()
  totalClass: string;

  @IsString()
  totalPayment: string;
}
