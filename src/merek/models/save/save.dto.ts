import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
