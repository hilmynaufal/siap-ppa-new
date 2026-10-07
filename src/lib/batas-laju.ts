/**
 * Pembatas laju sederhana di memori proses: cukup untuk memperlambat tebakan kode pada satu server/VM.
 * Bila aplikasi dijalankan lebih dari satu proses, pindahkan hitungan ke penyimpanan bersama.
 */
const jendela = new Map<string, { jumlah: number; habis: number }>();

export function periksaLaju(kunci: string, maks: number, ms: number, sekarang = Date.now()) {
  if (jendela.size > 5000) for (const [k, v] of jendela) if (v.habis <= sekarang) jendela.delete(k);
  const j = jendela.get(kunci);
  if (!j || j.habis <= sekarang) return { boleh: true, sisa: maks };
  return { boleh: j.jumlah < maks, sisa: Math.max(0, maks - j.jumlah) };
}

/** Mencatat satu kegagalan; hitungan direset setelah `ms` sejak kegagalan pertama dalam jendela. */
export function catatGagal(kunci: string, ms: number, sekarang = Date.now()) {
  const j = jendela.get(kunci);
  if (!j || j.habis <= sekarang) jendela.set(kunci, { jumlah: 1, habis: sekarang + ms });
  else j.jumlah += 1;
}
