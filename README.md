# Alif Fadhil Wibowo — Portfolio

Portfolio statis HTML, CSS, dan JavaScript native, mengikuti PRD visual, motion, dan tata letak dalam `docs/`. Tidak memakai framework baru, backend, database, WebGL, atau pustaka animasi eksternal.

## Menjalankan dan memperbarui

Butuh Node.js 20.10+ untuk build dan tes; tidak ada dependency npm yang perlu diinstal.

```sh
npm run build
npm run serve
```

Buka http://127.0.0.1:4173. Homepage dan detail `/work/[slug]/` menggunakan scroll dokumen biasa. Hasil build juga dapat dibuka dengan klik ganda `index.html`: link detail akan memakai file `index.html` yang benar.

- Konten profil, kontak, proyek, layanan, pengalaman, dan FAQ: `content/portfolio.json`.
- Komponen/template: `scripts/templates.mjs`.
- Build dan validasi data/aset: `scripts/build.mjs`.
- CSS/design tokens: `dist/css/style.css`.
- Interaksi dan motion: `dist/js/main.js`.
- Modal kerja sama, validasi, dan formatter email: `dist/js/collaboration.js`.
- Output siap hosting: `index.html` dan `work/*/index.html`.

Edit sumber data/template lalu jalankan build; perubahan manual pada HTML output akan tertimpa build berikutnya. Timeline, tools, live URL, dan galeri opsional hanya ditampilkan jika datanya tersedia. Kategori Exploration boleh kosong; UI menampilkan empty state yang jujur.

Kelima studi kasus berisi Overview, The challenge, My role & scope, Interface approach, Key features, dan Outcome. `role` ditampilkan sebagai metadata opsional. Rentang `timelineText` 1–3 minggu adalah durasi umum yang dikonfirmasi pemilik, bukan tanggal/durasi historis pasti masing-masing proyek. Tools hanya diisi jika ada bukti implementasi. Catatan sumber dan data yang masih perlu konfirmasi: [docs/CASE_STUDY_CONTENT.md](docs/CASE_STUDY_CONTENT.md).

## Pengujian

```sh
npm run build
npm run check
npm test
npm run test:browser
```

`check` memeriksa sintaks JavaScript; project tidak memakai TypeScript atau konfigurasi ESLint. Tes browser memakai Chrome/Edge lokal secara headless, menguji enam ukuran layar dan menyimpan screenshot serta hasil di `docs/audit/`. Atur `BROWSER_PATH` jika executable browser berada di lokasi lain. Profil browser sementara dibuat di direktori temp, terpisah dari profil browser pribadi.

Laporan audit: [docs/VISUAL_FIDELITY_AUDIT.md](docs/VISUAL_FIDELITY_AUDIT.md).

## Desain dan aset

Palet terpusat di `:root`: kanvas abu-abu bertekstur statis, panel off-white, teks hitam, Experience charcoal, dan titik status hijau. Warna metadata disesuaikan sedikit lebih gelap dari usulan PRD agar kontras AA. Foto cutout Hero adalah aset turunan baru hasil imagegen; foto asli tetap disimpan. Detail prompt dan pemeriksaan alpha: [docs/audit/image-prompt.md](docs/audit/image-prompt.md).

Filter, accordion, preview Experience, menu, dan transisi menghormati reduced motion. Isi tetap terbaca tanpa JavaScript. FAQ asli dipertahankan sebagai disclosure ringkas di Contact; testimonial tetap tidak dipublikasikan.

Portrait Hero memakai efek color reveal lokal di sekitar kursor: foto tetap grayscale, sedangkan mask radial memperlihatkan warna asli dengan tepi lembut. Lapisan dekoratif dibuat saat pertama kali digunakan dan memakai aset yang sama, bukan file gambar tambahan. Efek dinonaktifkan untuk perangkat sentuh, layar kecil, reduced motion, atau browser tanpa dukungan mask; foto utama tetap terbaca. Ukuran spotlight diatur melalui `--portrait-reveal-radius` pada `.portrait-color-reveal` di CSS.

## Formulir kerja sama

CTA Let’s collaborate, Contact Me, Let’s Talk, dan CTA layanan membuka modal native `<dialog>` dengan pilihan layanan, anggaran IDR, kontak, brief proyek, timeline, dan sumber kunjungan opsional. Kolom kanan berisi ringkasan/panduan, bukan testimonial. Layanan dan alamat penerima berasal dari `content/portfolio.json` melalui atribut konfigurasi script pada template.

Setelah validasi, tombol Open email app menyiapkan URI `mailto:` ke `wibowalif22@gmail.com` dengan subjek dan isi email terformat. Pengunjung tetap harus meninjau dan menekan Send di aplikasi email. Website tidak mengirim email langsung, memverifikasi pengiriman, atau menyimpan isian ke server/localStorage. Tersedia pratinjau, buka draft kembali, salin pesan, dan fallback salin manual. Jika JavaScript atau native dialog tidak tersedia, CTA mempertahankan tautan email awal.

Pilihan anggaran/timeline dan batas karakter diatur dalam `dist/js/collaboration.js`; rentang anggaran merupakan preferensi pengunjung, bukan daftar harga. Tes formatter ada di `tests/collaboration.test.mjs`; tes browser mencegat semua percobaan pembukaan email sehingga tidak menjalankan aplikasi email maupun mengirim pesan. Detail implementasi dan keterbatasan: [docs/COLLABORATION_FORM.md](docs/COLLABORATION_FORM.md).

## Hosting statis

Jalankan build, lalu publikasikan `index.html`, `work/`, dan `dist/` ke hosting statis seperti GitHub Pages. Setiap slug memiliki file HTML sendiri sehingga direct URL dan refresh tidak membutuhkan SPA rewrite. Semua tautan aset memakai path relatif agar tetap bekerja pada subfolder hosting. Jangan mempublikasikan seluruh source/arsip jika hanya halaman aktif yang diperlukan; `second.html` dan `public/` adalah versi lama yang tidak dipakai oleh entry point baru.
