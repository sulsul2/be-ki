interface PermohonanData {
  no: string;
  nomor_transaksi: string;
  tanggal_pengajuan: string;
  tipe_merek: string;
  merek: string;
  kelas: string;
  nomor_permohonan: string;
  tipe_permohonan: string;
  jenis_permohonan: string;
  status: string;
  kode_billing: string;
  status_pembayaran: string;
  actions: string;
}

export interface PermohonanResponse {
  status: string;
  message: string;
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: PermohonanData[];
}
