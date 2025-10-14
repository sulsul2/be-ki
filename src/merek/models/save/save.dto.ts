import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveGeneralDto {
  @IsString()
  @IsNotEmpty()
  tanggalPengajuan: string; // Contoh: "14/10/2025 11:37:02"

  @IsString()
  @IsNotEmpty()
  tipePermohonan: string; // Contoh: "MEREK_DAGANG, MEREK_JASA, MEREK_KOLEKTIF, MEREK_DAGANG_JASA"

  @IsString()
  @IsNotEmpty()
  asalPermohonan: string; // Contoh: "ONLINE"

  @IsString()
  @IsNotEmpty()
  jenisPermohonan: string; // Contoh: "UMKM" atau "NUMKM"

  @IsOptional()
  @IsString()
  kodeBilling?: string; // Kode billing bersifat opsional di sini
}
