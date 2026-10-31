# Modal formulir kerja sama

31 Oktober 2026. Dibangun mengikuti komposisi screenshot pengguna: panel putih membulat, form/pilihan pill di kiri, panel pendamping abu-abu di kanan, tombol hitam, serta backdrop gelap. Konten testimonial contoh tidak disalin karena pengguna sebelumnya menonaktifkan testimonial.

## Alur yang disetujui

Pengguna memilih **membuka aplikasi email dengan format otomatis**, bukan pengiriman langsung melalui backend.

1. Klik CTA kontak pada Hero, navbar, layanan, Contact, atau detail proyek.
2. Isi layanan (dapat lebih dari satu), anggaran, nama, email balasan, judul/brief proyek, dan timeline. Organisasi, waktu panggilan, dan sumber kunjungan opsional.
3. Klik **Open email app**. Form memvalidasi pilihan, email, batas panjang, dan field wajib, lalu menyiapkan subjek serta body plaintext berbaris CRLF.
4. Pratinjau berisi penerima/subjek/body tersedia di panel kanan. Aplikasi email menerima URI `mailto:` ke penerima terkonfigurasi. Pengunjung meninjau dan menekan Send sendiri.
5. Jika aplikasi email tidak terbuka, gunakan **Open draft again** atau **Copy email text**. Saat Clipboard API tidak tersedia/diizinkan, body pesan dipilih agar dapat disalin manual, dengan penerima dan subjek tetap ditampilkan.

UI tidak pernah mengklaim email terkirim. Tidak ada backend, API email, database, formulir POST/GET, localStorage, sessionStorage, atau pengumpulan analitik isian yang ditambahkan. Form menggunakan `method="dialog"`; submit ditangani lokal, bukan dikirim ke URL halaman.

## Konfigurasi dan file

- `dist/js/collaboration.js`: komponen mandiri tanpa dependensi. API formatter/validator dapat diimpor Node untuk tes, sedangkan browser memakai script klasik agar tetap bekerja melalui `file://`. Modal dibuat ketika CTA pertama kali digunakan; inisialisasi idempotent.
- `scripts/templates.mjs`: memasukkan script satu kali dengan alamat penerima dari `profile.email` dan pilihan layanan dari `services[].title`, diserialisasi/di-escape pada `data-contact-*`. Pilihan Other ditambahkan komponen.
- `dist/css/style.css`: style modal di-scope pada `.collaboration-dialog` dan `.inquiry-*`; media query satu kolom untuk mobile, batas viewport `vh/dvh`, scrolling internal, dan input mobile 16px untuk mengurangi auto-zoom.
- `index.html` dan kelima `work/*/index.html`: menambahkan script/konfigurasi yang sama. Isi Hero, kartu proyek, navbar, dan data pengguna tidak ditimpa.
- `tests/collaboration.test.mjs`, `tests/browser-audit.mjs`, `package.json`: cakupan validasi, formatter, keamanan, template/output, dan interaksi; script pemeriksaan sintaks mencakup komponen baru.

Anggaran adalah pilihan preferensi dalam IDR, bukan harga atau janji penawaran. Batas karakter dan opsi anggaran/timeline/sumber dapat diubah pada konstanta komponen. Jika alamat penerima atau layanan berubah, lakukan build dari data yang sudah diselaraskan.

## Aksesibilitas, resiliensi, dan keamanan

- Native modal memiliki heading/deskripsi berlabel; checkbox/radio/field memakai label serta pesan kesalahan yang terhubung. Fokus dibatasi dengan Tab/Shift+Tab, Escape/backdrop/tombol tutup tersedia, dan fokus/scroll dikembalikan ke halaman asal.
- Animasi masuk 2D mengikuti reduced motion. Tidak ada tilt atau penggantian perilaku hover navbar/foto yang sudah ada.
- Draft lama dibatalkan setelah input/change agar tombol buka/copy tidak memakai isian sebelumnya. Perubahan ringkasan memakai `textContent`, pesan memakai textarea plaintext, bukan HTML dari pengunjung.
- Penerima dikonfigurasi situs, bukan diisi pengunjung; target tidak dapat dialihkan lewat field form. Parameter URL hanya `subject` dan `body`, di-encode terpisah. Baris baru pada judul dirapikan, penerima berisi query/encoded header ditolak.
- Data form bertahan di memori halaman saat modal ditutup untuk mencegah hilangnya isian tanpa sengaja, tetapi hilang saat reload/navigasi. Tidak disimpan secara persisten.
- Tanpa JavaScript, script gagal dimuat, atau tanpa dukungan native dialog, tautan `mailto:` asli tetap tersedia. Implementasi tidak menambahkan layanan pihak ketiga.

## Verifikasi dan batasan

### Perbaikan scroll — 1 November 2026

- Seluruh isi modal memakai satu area scroll vertikal `.inquiry-layout`, bukan scroll terpisah per kolom. Tinggi dibatasi viewport `vh/dvh`, sedangkan baris grid mengikuti tinggi konten agar tidak dipotong pada layar laptop pendek. Tata letak dua kolom desktop dan satu kolom mobile tetap dipertahankan.
- Scrollbar berwarna hitam dengan track abu-abu terang, memakai `scrollbar-color`/`scrollbar-width` serta fallback `::-webkit-scrollbar`. Style hanya memengaruhi modal dan textarea di dalamnya; scrollbar halaman lain tidak berubah. Sistem operasi dengan scrollbar overlay dapat menyembunyikannya hingga pengguna mulai scroll.
- Tombol tutup tetap di luar area scroll. Halaman belakang tetap terkunci; membuka ulang modal kembali ke posisi atas tanpa menghapus isian. Setelah submit valid, pratinjau email dibawa ke area yang terlihat melalui scroller yang sama.
- Tes regresi menambahkan tinggi viewport laptop 620/600/510px dan mobile 600px, wheel di kedua kolom, akses bagian terbawah/tombol submit, fokus keyboard, draft yang menambah tinggi konten, serta posisi awal saat dibuka ulang. Screenshot laptop: `docs/audit/collaboration-modal-laptop.png` dan `collaboration-modal-laptop-bottom.png`.

### Pengujian keseluruhan

- Tes Node mencakup draft lengkap, nilai opsional, validasi pilihan/whitespace, batas panjang, Unicode, encoding/header injection, escaping markup, serta satu pemuatan komponen pada source/output.
- Tes Chrome memeriksa CTA, fokus/Tab/Shift+Tab, Escape/backdrop, scroll lock, invalid submit, URI draft, perubahan input/change, salin/fallback salin manual, modal pada 360/390/768/1024/1440px, dan semua detail serta `file://`.
- Alamat/contoh isian pada tes menggunakan identitas fiktif `example.com`. Seluruh klik email dalam tes dicegat setelah handler aplikasi sehingga tidak membuka aplikasi email dan tidak mengirim pesan; Clipboard API juga diganti sementara dalam konteks tes.
- Bukti render: `docs/audit/collaboration-modal-desktop.png`, `collaboration-modal-mobile.png`, dan `collaboration-email-preview.png`. Hasil browser final: `docs/audit/results.json`.
- Uptime email, konfigurasi default handler, batas panjang URI aplikasi email, hasil pengiriman, dan keyboard perangkat fisik belum diuji. Salin manual adalah fallback, bukan jaminan dukungan seluruh email client.

Hasil akhir setelah perbaikan scroll: `npm run check` berhasil; `npm test` 22/23 lulus, termasuk seluruh 10 tes formulir (satu kegagalan lama pada ekspektasi nama profil); `npm run test:browser` 40/40 lulus. Pemeriksaan visual screenshot desktop, laptop pendek, mobile, dan draft terisi menunjukkan form/pratinjau terbaca, tombol tutup tetap tersedia, scrollbar hitam terlihat, serta tidak ada horizontal overflow pada viewport yang diuji. Semua percobaan email dicegat; tidak ada pesan dikirim atau aplikasi email diluncurkan.

### Dampak lintas-project

Tidak ada perubahan API, database, migration, autentikasi, atau deployment. Semua CTA kontak ke penerima yang sama kini memakai satu komponen, sementara URL fallback dan template email lama dipertahankan. Template build serta output diperbarui untuk mencegah modal hilang ketika build berikutnya dijalankan.

Build penuh sengaja tidak dijalankan untuk menjaga edit manual Hero: HTML memakai Fadhil, tetapi `profile.solidPart` masih Fadhil Wibowo. Satu tes profil lama juga masih mengharapkan fullName yang berbeda dari data saat ini. Inkonsistensi nama ini tidak diperbaiki dalam lingkup formulir; perlu konfirmasi pemilik sebelum penyeragaman/build penuh.
