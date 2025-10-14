import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum TipePermohonanEnum {
  MEREK_DAGANG = 'MEREK_DAGANG',
  MEREK_JASA = 'MEREK_JASA',
  MEREK_KOLEKTIF = 'MEREK_KOLEKTIF',
  MEREK_DAGANG_JASA = 'MEREK_DAGANG_JASA',
}

export enum JenisPermohonanEnum {
  UMKM = 'UMKM',
  UMUM = 'NUMKM',
}

export enum JenisKepemilikanEnum {
  PERORANGAN = 'Perorangan',
  BADAN_HUKUM = 'Badan Hukum',
}

export class SaveGeneralDto {
  @IsString()
  @IsNotEmpty()
  tanggalPengajuan: string; // Contoh: "14/10/2025 11:37:02"

  @IsEnum(TipePermohonanEnum, {
    message:
      'tipePermohonan harus salah satu dari: MEREK_DAGANG, MEREK_JASA, MEREK_KOLEKTIF, MEREK_DAGANG_JASA',
  })
  @IsNotEmpty()
  tipePermohonan: TipePermohonanEnum;

  @IsString()
  @IsNotEmpty()
  asalPermohonan: string; // Contoh: "ONLINE"

  @IsEnum(JenisPermohonanEnum, {
    message: 'jenisPermohonan harus salah satu dari: UMKM, NUMKM',
  })
  @IsNotEmpty()
  jenisPermohonan: JenisPermohonanEnum;

  @IsOptional()
  @IsString()
  kodeBilling?: string;
}

class PemohonDetailDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class SavePemohonDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  applicationNo: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nationalityId: string;

  @IsEnum(JenisKepemilikanEnum, {
    message: 'ownerType harus salah satu dari: Perorangan, Badan Hukum',
  })
  @IsString()
  @IsNotEmpty()
  ownerType: JenisKepemilikanEnum;

  @IsString()
  @IsNotEmpty()
  countryId: string;

  @IsString()
  @IsNotEmpty()
  provinceId: string;

  @IsString()
  @IsNotEmpty()
  cityId: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  noKtp?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsBoolean()
  addressFlag: boolean;

  @IsOptional() @IsString() postCountryId?: string;
  @IsOptional() @IsString() postProvinceId?: string;
  @IsOptional() @IsString() postCityId?: string;
  @IsOptional() @IsString() postAddress?: string;
  @IsOptional() @IsString() postZipCode?: string;
  @IsOptional() @IsString() postPhone?: string;
  @IsOptional() @IsEmail() postEmail?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PemohonDetailDto)
  additionalOwners?: PemohonDetailDto[];
}

export class SavePriorityDto {
  date: string;
  country: string;
  countryId: string;
  no: string;
  appNo: string;
}

export class DeletePriorityDto {
  priorId: string;
  appNo: string;
}

export class SaveMerekDto {
  appNo: string;
  listImageDetail: string;
  listDelete: string;
  agreeDisclaimer: string;
  txTmBrand: string;
}
