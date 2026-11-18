# Portal Evaluasi Walas Web v2 — Starter

Tujuan: memindahkan Portal Walas dari Google Apps Script + Google Sheet sebagai database transaksi
ke website normal dengan Supabase PostgreSQL sebagai database/API dan Firebase Hosting sebagai hosting statis.

## Prinsip migrasi
- Portal Apps Script V28 + Promosi Stable tetap dipakai selama pengujian.
- Web v2 tidak mengubah atau menghapus data portal lama.
- Tampilan mempertahankan gaya V28: teal, menu Walas/Admin, Evaluasi Anggota, Evaluasi Promosi.
- Walas tetap login dengan **Kelas + PIN**.
- Di belakang layar, Kelas + PIN dipetakan ke Supabase Auth user seperti `c116@walas.portal`.
- Hak akses kelas ditegakkan di database melalui JWT + RLS / RPC, bukan hanya parameter browser.
- Anggota status **Mutasi** tidak dikirim ke Walas; Admin tetap dapat melihatnya.

## Arsitektur
Browser → Supabase Auth + PostgreSQL/RPC → Firebase Hosting (frontend statis)

Tidak ada Apps Script pada jalur login/load/save Web v2.

## Isi paket
- `public/` — website statis yang dapat di-host di Firebase
- `database/001_schema.sql` — tabel dan index
- `database/002_security_and_rpc.sql` — RLS + RPC Walas/Admin
- `database/003_seed_rubric.sql` — 33 indikator Evaluasi Promosi
- `scripts/provision-users.mjs` — membuat akun Walas/Admin di Supabase Auth
- `scripts/migrate-csv.mjs` — migrasi ANGGOTA/EVALUASI/KELAS_AKSES dari CSV
- `migration/` — tempat menaruh CSV export dari Google Sheet
- `firebase.json` — konfigurasi Firebase Hosting

## Urutan implementasi
1. Buat project Supabase.
2. Jalankan SQL `001`, `002`, `003` di SQL Editor Supabase.
3. Export sheet `KELAS_AKSES`, `ANGGOTA`, dan `EVALUASI` menjadi CSV, simpan di `migration/`.
4. Isi `.env` berdasarkan `.env.example`.
5. Jalankan `npm install`.
6. Jalankan `npm run migrate`.
7. Siapkan `scripts/classes.json` dan `scripts/admins.json`, lalu `npm run provision`.
8. Salin `public/js/config.example.js` menjadi `public/js/config.js` dan isi URL + publishable key Supabase.
9. Uji lokal dengan HTTP server.
10. Deploy folder `public` ke Firebase Hosting.

## Catatan PIN
Hash PIN Google Apps Script lama tidak dapat dikonversi kembali menjadi PIN plaintext.
Jika PIN plaintext lama tidak tersedia, buat PIN baru saat provisioning Supabase.

## Status starter
Starter ini sudah mencakup:
- login Walas Kelas+PIN
- session Supabase
- Evaluasi Anggota bulanan + riwayat
- batch save satu transaksi database
- sinkronisasi profil anggota pada periode berjalan
- Mutasi hanya terlihat Admin
- Evaluasi Promosi 33 indikator
- dashboard rekap Admin
- daftar anggota Admin
- dashboard promosi Admin (read-only pada starter)

Fitur administratif yang memerlukan service-role seperti reset PIN Walas dari Admin sebaiknya
ditambahkan sebagai Supabase Edge Function setelah database awal berhasil diuji.
