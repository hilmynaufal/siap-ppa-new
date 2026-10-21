/**
 * Batas pool koneksi `pg` per proses aplikasi. Pooler basis data (mis. Supabase mode session) membatasi
 * jumlah klien total, dan bawaan `pg` (10 per proses) mudah menghabiskannya bila ada beberapa proses.
 */
export const POOL_MAX_BAWAAN = 5;

export function konfigurasiPool(env: Record<string, string | undefined>) {
  const n = Number(env.DB_POOL_MAX);
  return {
    max: Number.isInteger(n) && n >= 1 && n <= 50 ? n : POOL_MAX_BAWAAN,
    // Koneksi menganggur dikembalikan ke pooler agar tidak menahan jatah klien.
    idleTimeoutMillis: 10_000,
    // Gagal cepat bila pooler penuh, daripada permintaan menggantung lama.
    connectionTimeoutMillis: 10_000,
  };
}
