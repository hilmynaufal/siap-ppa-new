-- Data referensi: 31 kecamatan di Kabupaten Bandung (pilihan "kecamatan tempat kejadian" pada formulir pelaporan).
-- Aman dijalankan ulang: nama yang sudah ada dilewati.
INSERT INTO kecamatan (id, nama)
SELECT gen_random_uuid()::text, k.nama
FROM (VALUES
  ('Arjasari'), ('Baleendah'), ('Banjaran'), ('Bojongsoang'), ('Cangkuang'), ('Cicalengka'),
  ('Cikancung'), ('Cilengkrang'), ('Cileunyi'), ('Cimaung'), ('Cimenyan'), ('Ciparay'),
  ('Ciwidey'), ('Dayeuhkolot'), ('Ibun'), ('Katapang'), ('Kertasari'), ('Kutawaringin'),
  ('Majalaya'), ('Margaasih'), ('Margahayu'), ('Nagreg'), ('Pacet'), ('Pameungpeuk'),
  ('Pangalengan'), ('Paseh'), ('Pasirjambu'), ('Rancabali'), ('Rancaekek'), ('Solokanjeruk'),
  ('Soreang')
) AS k(nama)
ON CONFLICT (nama) DO NOTHING;
