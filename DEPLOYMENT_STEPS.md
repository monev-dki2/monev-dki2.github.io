# Portal Walas Web v2 — Tahap Deployment

## Tahap 1 — Database (SELESAI)
Supabase `portal-walas-v2` telah dibuat dan diisi dengan master portal lama.

## Tahap 2 — Autentikasi (SELESAI)
Walas menggunakan Kelas + PIN lama. Admin menggunakan Admin ID + PIN lama.
PIN plaintext tidak disimpan; database menyimpan hash dan session-token hash.

## Tahap 3 — Testing (SELESAI)
1. Syntax JS diperiksa.
2. Website diuji lewat local HTTP server.
3. Session Walas diuji terhadap C101.
4. Dashboard dan Promosi diuji.
5. Session Admin diuji untuk recap, anggota, dan promosi.
6. RPC Auth lama yang sudah tidak dipakai ditutup.

## Tahap 4 — Firebase Hosting (BERIKUTNYA)
Firebase harus terhubung ke ChatGPT agar deployment bisa dilakukan langsung.
Setelah terhubung:
1. Buat/pilih Firebase project untuk Portal Walas.
2. Pastikan Hosting aktif.
3. Upload/deploy folder `public/` menggunakan `firebase.json` yang sudah tersedia.
4. Dapatkan URL `*.web.app` / `*.firebaseapp.com`.
5. Buka URL dan uji login Walas.
6. Uji login Admin.
7. Uji simpan satu kelas/periode non-kritis dahulu.
8. Bandingkan hasil Supabase dengan portal Apps Script lama.
9. Portal lama tetap aktif selama masa paralel testing.

## Tahap 5 — Go-live
Setelah testing paralel dinyatakan sesuai:
- gunakan Web v2 sebagai portal utama;
- portal Apps Script lama dipertahankan sementara sebagai fallback/read-only;
- domain khusus dapat dipasang kemudian bila diinginkan.

## Catatan
Jangan menaruh service-role key Supabase di browser/frontend. File `public/js/config.js` hanya menggunakan publishable key.
