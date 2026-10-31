# Navbar — referensi terbaru

31 Oktober 2026. Acuan visual: screenshot navbar yang dikirim pengguna pada permintaan ini. Referensi terbaru menggantikan komposisi navbar sebelumnya, bukan desain seluruh halaman.

## Perubahan

- Status berbentuk pill putih dengan border tipis, titik hijau, dan shadow halus di kiri. Logo di dalam header dihapus sesuai referensi; aset logo dan favicon tetap tersedia.
- Work, Service, Experience, Contact, dan CTA berada pada satu baris desktop dengan jarak yang terdistribusi. Angka menggunakan bracket pada baseline teks, bukan superscript.
- Jumlah tetap berdasarkan data: Work `[05]`, Service `[3]`, dan Experience `[3y+]`, bukan angka contoh `[40]`, `[4]`, `[9y+]` pada gambar.
- CTA Let’s Talk berbentuk pill hitam dengan panah dan shadow. Transform hover/active pada CTA dan hover panah dinonaktifkan agar tidak bergeser atau menimbulkan efek 3D.
- Breakpoint navbar pada CSS dan JavaScript disamakan ke 900px. Di bawahnya tetap ada menu lipat dengan Escape/focus restore dan area sentuh 44px. Breakpoint layout Hero dan section lain tidak berubah.

## Dampak dan batas perubahan

- Sumber header (`scripts/templates.mjs`) dan bagian header pada `index.html` diperbarui bersamaan. CSS header dibatasi pada `.site-header`, `.primary-nav`, dan metadata navbar; status Contact dan detail tidak berubah.
- Tautan section dan template email tetap sama. Tidak ada perubahan data profil, angka pengalaman, slug, proyek, foto, backend, atau deployment.
- Build seluruh HTML tidak dijalankan karena HTML Hero memiliki edit pengguna yang belum diselaraskan dengan `profile.solidPart`. Menghasilkan ulang seluruh halaman sekarang berisiko mengembalikan teks Hero menjadi Fadhil Wibowo. Perubahan manual lain di HTML dipertahankan.
- Tes profil yang sebelumnya gagal tetap dibiarkan: sumber `fullName` adalah Alif Fadhil, sedangkan tes mengharapkan Alif Fadhil Wibowo. Penetapan nama/penyesuaian tes merupakan tindak lanjut terpisah yang membutuhkan persetujuan pengguna.

## Verifikasi

- `npm run check`: berhasil.
- `npm test`: 12/13 lulus; satu kegagalan profil di atas tidak berkaitan dengan navbar. Tes navbar baru mencakup bracketed counts berbasis data, tautan anchor, status, dan destination email.
- Tes browser mencakup keselarasan status/tautan, shadow, format angka, hover tanpa transform, resize menu 899↔900px, mobile menu/keyboard, responsive homepage/detail, dan regresi interaksi yang sudah ada.
- Screenshot `docs/audit/navbar-reference-width.png` memuat header selebar 932px agar dapat dibandingkan dengan referensi. Screenshot Hero desktop/mobile juga diperbarui untuk mengecek keselarasan dengan layout sekitarnya.

Hasil browser final dicatat di `docs/audit/results.json`. Browser bawaan tidak tersedia; verifikasi menggunakan Chrome headless lokal dengan profil sementara, tanpa mengirim email atau mengakses akun pribadi.
