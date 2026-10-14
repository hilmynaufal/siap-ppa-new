// Membuat aset logo dari assets/logo/sumber.webp (lockup dari desainer, latar putih): node scripts/logo-aset.mjs
// Latar putih diubah jadi transparan, lalu dipotong menjadi simbol dan lockup, plus ikon situs.
// Bila desainer memberi berkas vektor atau PNG transparan, ganti sumbernya dan hapus langkah transparansi.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SUMBER = "assets/logo/sumber.webp";
const GARIS_SIMBOL = 845; // baris pertama teks "SIAP PPA"; di atasnya hanya simbol

mkdirSync("public/brand", { recursive: true });

/** Putih -> transparan dengan tepi halus; warna tepi dikembalikan ke warna asli (bukan campuran dengan putih). */
async function transparan() {
  const { data, info } = await sharp(SUMBER).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const tebal = 255 - Math.min(r, g, b);
    const a = Math.min(1, Math.max(0, (tebal - 14) / (205 - 14)));
    out[o + 3] = Math.round(a * 255);
    if (a > 0) {
      const un = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)));
      out[o] = un(r); out[o + 1] = un(g); out[o + 2] = un(b);
    }
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
}

const penuh = await transparan();
const png = await penuh.png().toBuffer();
const { width: W } = await sharp(png).metadata();

const lockup = await sharp(png).trim({ threshold: 1 }).toBuffer();
await sharp(lockup).resize({ width: 900 }).webp({ quality: 90, alphaQuality: 100 }).toFile("public/brand/siap-ppa-lengkap.webp");

const atas = await sharp(png).extract({ left: 0, top: 0, width: W, height: GARIS_SIMBOL }).toBuffer();
const simbolMentah = await sharp(atas).trim({ threshold: 1 }).toBuffer();
const m = await sharp(simbolMentah).metadata();
const sisi = Math.max(m.width, m.height);
const kotak = await sharp(simbolMentah)
  .extend({
    top: Math.floor((sisi - m.height) / 2), bottom: Math.ceil((sisi - m.height) / 2),
    left: Math.floor((sisi - m.width) / 2), right: Math.ceil((sisi - m.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();
await sharp(kotak).resize(512, 512).webp({ quality: 90, alphaQuality: 100 }).toFile("public/brand/simbol.webp");

// Ikon situs: simbol dengan sedikit ruang tepi; berlatar putih untuk ikon layar utama iOS.
const dengan = (ukuran, pad, latar) => {
  const tepi = Math.round(ukuran * pad);
  const dalam = ukuran - 2 * tepi;
  return sharp(kotak).resize(dalam, dalam).extend({ top: tepi, bottom: tepi, left: tepi, right: tepi, background: latar }).png();
};
const bening = { r: 0, g: 0, b: 0, alpha: 0 };
const putih = { r: 255, g: 255, b: 255, alpha: 1 };
await dengan(512, 0.06, bening).toFile("src/app/icon.png");
await dengan(180, 0.1, putih).flatten({ background: "#ffffff" }).toFile("src/app/apple-icon.png");

// favicon.ico: satu gambar PNG 48x48 di dalam wadah ICO.
const ico48 = await dengan(48, 0.04, bening).toBuffer();
const kepala = Buffer.alloc(22);
kepala.writeUInt16LE(0, 0); kepala.writeUInt16LE(1, 2); kepala.writeUInt16LE(1, 4);
kepala[6] = 48; kepala[7] = 48; kepala.writeUInt16LE(1, 12); kepala.writeUInt16LE(32, 14);
kepala.writeUInt32LE(ico48.length, 14 + 4); kepala.writeUInt32LE(22, 18);
writeFileSync("src/app/favicon.ico", Buffer.concat([kepala, ico48]));
console.log("simbol", m.width, "x", m.height, "| lockup", (await sharp(lockup).metadata()).width, "x", (await sharp(lockup).metadata()).height);
