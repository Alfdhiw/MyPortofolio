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

Experience mendukung `description` berupa teks atau array teks (ditampilkan sebagai list). `galleryImages` berisi screenshot tambahan setelah `previewImage`; dua gambar atau lebih memakai carousel 3D dengan dot navigasi, keyboard, dan swipe. Saat mouse/pen berada di stage pada layar yang mendukung hover, autoplay maju ke kiri mengikuti nilai `interval` (milidetik) di `initExperienceCarousels()` pada `dist/js/main.js` dan mengulang slide pertama dengan arah 3D yang sama. Autoplay berhenti saat cursor keluar, panel ditutup, tab/jendela tidak aktif, atau navigasi keyboard mendapat fokus. Reduced motion menonaktifkan autoplay dan menampilkan slide datar; tanpa JavaScript, semua screenshot tetap tersedia. Panel Experience mengikuti lebar container (`max-width: none`).

Pada perangkat dengan pointer presisi/hover, 20% tepi kiri dan kanan stage memakai cursor panah lingkaran SVG lokal (`dist/img/cursor-circle-left.svg` dan `cursor-circle-right.svg`). Klik tepi berpindah ke slide sebelumnya/berikutnya; drag/swipe tetap diprioritaskan dan area tengah tidak menjadi tombol. Cursor direset saat meninggalkan stage, panel ditutup, viewport berubah, atau jendela kehilangan fokus. Tidak ada dependensi Font Awesome/CDN yang ditambahkan.

Kehalusan transisi carousel diatur terpisah dari interval autoplay: `--carousel-motion-duration: 850ms` dan `--carousel-motion-ease` pada `.experience-carousel` di CSS. JavaScript memakai parameter yang sama untuk animasi kartu depan dan kartu samping; kartu samping didaur ulang melalui kedalaman belakang agar loop tidak terlihat melompat. Reduced motion tetap tanpa animasi.

Panel Experience membuka/menutup melalui animasi tinggi dan opacity 560ms, mengikuti `--experience-toggle-duration` / `--experience-toggle-ease` pada `.experience`. Klik berulang melanjutkan dari tinggi saat ini; selesai animasi, panel kembali ke tinggi otomatis. Panel tertutup memakai `aria-hidden` dan `inert`; autoplay berhenti sejak penutupan dimulai. Reduced motion, resize, dan pagehide menyelesaikan state tanpa menyisakan tinggi tetap.

Pengalaman magang BPS Kota Semarang (Agustus 2025–Januari 2026) berada setelah PT Karya Indonesia, dengan peran Web Application - Backend Developer dan list lingkup backend SIMKADPRO. Tujuh aset asli disalin ke `dist/img/portfolio/bps-semarang/`: empat screenshot aplikasi dan tiga foto kegiatan. Carousel tiap pengalaman memiliki state dan navigasi sendiri. `projectSlug` opsional; tautan Related project hanya ditampilkan bila ada studi kasus terkait. Dimensi foto JPEG disimpan pada metadata aset; screenshot PNG diverifikasi saat pemuatan data. Narasi pekerjaan merupakan draft sesuai peran dan fitur yang terlihat, tanpa klaim teknologi atau metrik hasil yang belum dikonfirmasi.

Carousel Institutional Systems mempertahankan screenshot SIMONE asli dan menambahkan dua **rekonstruksi antarmuka**: dashboard peserta dan formulir pendaftaran. Kedua mockup memakai data demonstrasi dan bukan bukti halaman historis atau aplikasi backend yang berjalan. Sumber HTML/CSS yang dapat diedit ada di `assets/previews/simone/`; jalankan `npm run render:simone` untuk merender ulang PNG 1440×900 di `dist/img/portfolio/simone-*-concept.png` menggunakan Chrome/Edge lokal (`BROWSER_PATH` opsional). Proses tidak memerlukan jaringan, API key, atau layanan image generation; gambar dirender dari komponen HTML/CSS untuk menjaga teks, tabel, dan form tetap presisi. Sumber ini tidak dimuat oleh halaman portofolio; runtime hanya memakai PNG. Halaman studi kasus SIMONE yang lama tetap menggunakan bukti screenshot aslinya.

Setelah mengedit mockup, periksa sumbernya dengan `npm run test:browser -- --simone-previews-only` untuk memastikan footer, label data demo, dan tombol tidak terpotong pada viewport render. Mode ini menyimpan laporan terpisah (`docs/audit/results-simone-previews.json`); audit penuh tetap menguji integrasi carousel di homepage.

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
