# Deployment Portal Walas Web v2 ke Render

## Status build
- Backend: Supabase project `portal-walas-v2`
- Frontend: static site di folder `public/`
- Portal Apps Script lama tidak perlu dimatikan selama pengujian.

## Cara deploy paling sederhana
1. Hubungkan aplikasi Render di ChatGPT bila tersedia.
2. Buat Static Site baru bernama `portal-walas-v2`.
3. Publish directory: `public`.
4. Tidak diperlukan build command.
5. Setelah URL Render tersedia, uji:
   - Login Walas: Kelas + PIN lama.
   - Dashboard Evaluasi Anggota.
   - Riwayat periode.
   - Evaluasi Promosi.
   - Login Admin: Admin ID + PIN lama.
   - Rekap Admin, Daftar Anggota, dan Dashboard Promosi.
6. Jangan matikan Apps Script lama sampai pengujian Web v2 dinyatakan selesai.

## Catatan
File `render.yaml` sudah ditambahkan sebagai blueprint static site. Tidak ada service-role key Supabase di frontend; hanya publishable key yang boleh berada di browser.
