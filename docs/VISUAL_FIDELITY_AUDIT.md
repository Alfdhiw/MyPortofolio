# Visual Fidelity Audit — MyPortofolio

Tanggal: 31 Oktober 2026. Acuan: [PRD 01](PRD_01_Desain_Visual_Portofolio.md), [PRD 02](PRD_02_Efek_Animasi_Interaksi_Portofolio.md), dan [PRD 03](PRD_03_Tata_Letak_Konten_Portofolio.md).

## Bukti dan batas penilaian

Ketiga PRD dibaca sebelum perubahan. Video 21,57 detik yang disebut dalam PRD tidak ditemukan di repository atau lampiran yang tersedia. Lampiran saat audit berisi master prompt berbentuk teks. Karena itu audit memverifikasi komposisi dan perilaku terhadap spesifikasi tertulis, bukan mengklaim pixel-perfect atau timing identik dengan video yang tidak tersedia. Angka ukuran/easing yang disebut PRD diperlakukan sebagai usulan implementasi, bukan hasil sampling video.

Baseline implementasi adalah HTML statis dengan Hero berisi blob/statistik, navbar pill, kartu layanan, About/Experience gabungan, FAQ, dan CTA. Halaman detail, filter, accordion layanan, serta floating preview belum ada. Sebagian perubahan yang diperlukan bersifat struktural karena baseline belum menerapkan S01–S06, bukan sekadar berbeda warna.

Pemeriksaan akhir menggunakan Chrome headless lokal, screenshot render, computed styles, keyboard/pointer input, dan tes routing. Browser bawaan sesi tidak tersedia, sehingga tidak digunakan. Tidak ada email dikirim atau publikasi/deployment dilakukan.

## Temuan dan perbaikan per section

| Area | Ketidaksesuaian terverifikasi pada baseline | Perbaikan | Acuan |
|---|---|---|---|
| Kanvas dan panel | Halaman putih edge-to-edge; tidak ada panel pada kanvas abu-abu bertekstur | Kanvas `#C9C9C9`, SVG paper statis, panel off-white maksimum 1280px, radius 10px, content gutter konsisten | UI-01, PRD 01 §3; PRD 03 §3 |
| Header | Brand/menu lama, anchor `projects/services/faqs`; tidak ada status dan jumlah dari data | Status nyata, Work 05, Service 03, Experience 3+, Contact, CTA email; collapse di tablet/mobile, Escape dan focus return | UI-02, AN-02, FR-02 |
| Hero | Kalimat promosi menggantikan nama; blob dan floating stat cards; portrait tidak ada di Hero | Nama asli outline/solid, cutout foreground tengah, role/bio kiri, social pills kanan, CTA; tablet dua zona + sosial satu baris; mobile nama → portrait → bio/CTA → sosial | UI-03, AN-01, S01 |
| Selected Work | Thumbnail pendek, tanpa ghost heading/filter; link langsung eksternal atau `#about` | Ghost PORTFOLIO, `/SELECTED WORK`, filter All/Real/Exploration, 4 featured + View All untuk 5 karya; media ratio 1.45, badge, tags, hover arrow, detail per slug | UI-04, AN-04, S02, FR-03/04 |
| Service | Tiga kartu terpisah, tidak dapat diexpand | Baris hairline dengan button dan ARIA; maksimal satu panel charcoal; deskripsi, mockup -4°, CTA, simbol ×; height transition 320ms; gambar turun pada mobile | UI-05, AN-05, S03, FR-05 |
| Experience | Riwayat kecil dalam About terang; tidak ada preview | Section charcoal, ghost EXPERIENCE, organisasi/peran dan periode dua kolom; mobile periode ditumpuk; desktop preview mengikuti pointer dengan lerp .15, rotasi -4°, bounded viewport, pointer-events none; tap/keyboard mendapat inline preview | UI-06, AN-06/07, S04, FR-08 |
| Contact | Banner biru pada desain lama, lalu putih sederhana; hierarchy belum mengikuti closing CTA | Panel paper halus, status pill, headline besar terpusat, email template valid, avatar asli, sosial wrapping; FAQ tetap tersedia sebagai disclosure ringkas | UI-07, AN-08, S05, FR-06 |
| Detail karya | Tidak ada halaman studi kasus | Lima halaman HTML per slug; header, kategori, ringkasan, Service, live URL jika tersedia, cover utuh, narasi berbasis informasi yang ada, More Work tanpa current project, Contact, Back fallback | UI-08, AN-09, S06, FR-04/09 |
| Motion | Tilt 3D, WebGL, reveal 40px yang dapat meninggalkan konten opacity 0 | WebGL/tilt/orbit dikeluarkan dari entry point aktif; entrance 12–24px, scroll threshold .18, stagger 70ms, hover zoom 1.02, fade route 140ms + entrance detail 360ms; konten tetap terlihat jika JS tidak berjalan | PRD 02 §1–4, AN-01–09 |

## Koreksi hasil pengujian interaksi

- Preview Experience kembali dapat muncul ketika pointer bergerak di baris sesudah scroll; tidak mengharuskan keluar/masuk ulang dari section.
- Preview mengambang tidak ditampilkan ganda ketika inline preview pada baris itu sudah dibuka.
- Native cross-document view transition sempat menghasilkan `InvalidStateError` pada alur tertentu. Implementasi akhir memakai fade biasa yang lebih stabil, sesuai alternatif AN-09.
- Exit animation dibersihkan pada `pageshow`, sehingga Back/BFCache tidak meninggalkan homepage transparan atau guard navigasi terkunci.
- Filter menangani pergantian cepat dan pembatalan animasi; accordion menangani switch/close berulang tanpa panel tersangkut.
- Reduced motion menghentikan preview dan menyelesaikan animasi yang sedang berjalan; semua isi tetap tersedia.
- Nama outline diberi spacing lebih longgar agar stroke tetap terbaca; metadata memakai abu-abu lebih gelap dari usulan `#7A7A7A` untuk kontras.

## Keputusan implementasi dan komponen yang dipertahankan

1. Stack tetap HTML/CSS/JavaScript native. Build Node tanpa dependency menghasilkan `work/[slug]/index.html`, sehingga clean direct URL, refresh, hosting statis, subfolder hosting, dan pembukaan file lokal tidak memerlukan router/backend baru.
2. Profil, proyek, layanan, pengalaman, FAQ, jumlah navbar dan kontak berasal dari `content/portfolio.json`. Data dipisahkan dari template reusable. Tidak ada data orang/proyek dari video yang diadopsi.
3. Logo AF monokrom yang sudah sesuai dipertahankan. Foto asli tetap tersimpan dan digunakan sebagai avatar. Email `wibowalif22@gmail.com`, isi template inquiry, tautan sosial relevan, dan live destinations proyek dipertahankan. Karind tetap memiliki Live Preview ke `https://staging.karind.id` pada detailnya.
4. Bio/skills/riwayat yang lama dipindahkan ke Hero dan Experience agar homepage mengikuti lima section wajib. Stats/process cards yang tidak termasuk komposisi baru tidak lagi dirender; angka profil terdahulu tetap tersimpan pada data. FAQ yang berfungsi dipertahankan dalam Contact. Testimonial tetap tidak dipublikasikan.
5. Portrait transparan baru dihasilkan menggunakan skill imagegen, mode built-in background extraction, dari foto milik pengguna. Alpha corner diverifikasi 0 di browser. Prompt, sumber, batasan, dan tujuan aset ada di [image-prompt.md](audit/image-prompt.md). Hasil AI diperiksa secara visual, tidak diklaim sebagai ekstraksi piksel identik.
6. Timeline/tools per proyek tidak ditebak dari daftar keterampilan global. Field kosong dihilangkan dari halaman publik sesuai S06. Tidak ada Live Preview palsu untuk SIMONE/SICULI. Exploration menampilkan empty state karena belum ada entri terverifikasi.
7. File arsip `second.html`, `public/`, serta stylesheet/script lama yang tidak dipakai entry point baru tidak dihapus, untuk menjaga perubahan/aset pengguna yang tidak terkait. Deployment disarankan hanya memuat output aktif dan `dist/`.

## File dibuat atau diperbarui

- Diperbarui: `index.html` (output build), `dist/css/style.css`, `dist/js/main.js`, `README.md`.
- Sumber baru: `content/portfolio.json`, `scripts/templates.mjs`, `scripts/build.mjs`, `scripts/serve.mjs`, `package.json`.
- Halaman detail baru: `work/{karind,matsuri-castle,pasar-iwak,simone,siculi}/index.html`.
- Aset baru: `dist/img/paper.svg`, `dist/img/alif-portrait-cutout.png`.
- Tes: `tests/portfolio.test.mjs`, `tests/browser-audit.mjs`.
- Dokumentasi/bukti: laporan ini dan `docs/audit/`.
- Ketiga PRD acuan tidak diedit.

## Pengujian akhir

| Pemeriksaan | Hasil |
|---|---|
| `npm run build` | Berhasil, homepage + 5 detail |
| `npm run check` | Sintaks JavaScript berhasil |
| `npm test` | 9/9 tes data, template, escaping, URL, dan static routes berhasil |
| `npm run test:browser` | 31/31 pemeriksaan berhasil; lihat [results.json](audit/results.json) |
| Homepage + detail | 360, 390, 768, 1024, 1440, 1920px; tidak ada horizontal overflow; grid 1/2 kolom sesuai breakpoint |
| Input | Filter/empty state/load more, keyboard Enter, Escape/menu, touch fallback Experience, floating preview, FAQ, Back normal/animated/direct-entry |
| Aksesibilitas dasar | Satu H1 per halaman, ARIA panels, focus styles, visible touch targets ≥44px, kontras sampel teks ≥4.5:1, reduced motion |
| Resiliensi | Konten terbaca tanpa JS, file entry tetap berfungsi, 0 runtime exception dan 0 failed local asset requests pada alur yang diuji |
| Lint/TypeScript | Tidak ada konfigurasi ESLint atau TypeScript pada project; tidak diklaim telah dijalankan |

URL eksternal diperiksa format/scheme-nya dan dipertahankan dari data pengguna. Browser audit memverifikasi navigasi internal dan destination CTA; tidak mengirim email, login, atau menjamin uptime server eksternal.

### Bukti render

- [Hero desktop](audit/hero-desktop.png), [Hero mobile](audit/hero-mobile.png), [Hero tablet](audit/hero-tablet.png).
- [Homepage desktop lengkap](audit/home-desktop.png), [homepage mobile lengkap](audit/home-mobile.png).
- [Service terbuka](audit/service-open.png), [Experience floating preview](audit/experience-preview.png).
- [Detail desktop](audit/detail-desktop.png), [detail mobile](audit/detail-mobile.png).

## Masalah atau keterbatasan yang masih tersisa

1. **Visual comparison terhadap video asli belum dapat dilakukan.** Video/screenshot acuan desain baru tidak tersedia. Persentase fidelity atau klaim identik tidak dapat dibenarkan.
2. **Konten studi kasus telah diperdalam pada pembaruan lanjutan:** kelima proyek kini memiliki enam bagian narasi, peran full stack yang dikonfirmasi pemilik, rentang umum pengerjaan 1–3 minggu yang dilabeli jelas, serta caption. Tools Matsuri Castle diverifikasi melalui source publik. Stack empat proyek lainnya, durasi individual, kontribusi teknis terperinci, hasil terukur, dan galeri tambahan masih memerlukan data pemilik. Lihat [catatan konten studi kasus](CASE_STUDY_CONTENT.md). Label organisasi internship di Experience masih mengikuti teks generik sebelumnya dan belum diubah.
3. **Uji perangkat nyata/cross-engine belum dilakukan.** Hasil otomatis berasal dari Chrome lokal dengan emulasi viewport/touch; bukan pengganti pemeriksaan Safari/iOS, Firefox, screen reader penuh, atau pengukuran performa perangkat menengah.
4. **Aset portrait PNG masih sekitar 1,25 MB.** Sudah diberi dimensi dan prioritas pemuatan; format terkompresi dengan alpha dapat dievaluasi terpisah jika ingin mengurangi waktu muat mobile.

## Analisis dampak dan Next Recommended Updates

Tidak ada API, database, migration, autentikasi, atau backend yang diubah. Perubahan berdampak pada navigasi anchor, slug proyek, output hosting, sumber konten, style, dan interaksi. Anchor lama `#projects/#services/#about` memiliki alias ke section baru ketika JS aktif. Build harus dijalankan setelah mengubah data/template agar halaman detail dan jumlah navbar tetap sinkron.

| Prioritas | Rekomendasi | Area terdampak | Alasan dan risiko jika tidak dilakukan |
|---|---|---|---|
| Medium | Bandingkan screenshot dengan video asli saat tersedia | Hero, Service, Experience, detail, dokumen audit | Menuntaskan fidelity visual/timing yang tidak dapat diukur sekarang; tanpa acuan, selisih komposisi halus tetap mungkin ada |
| Medium | Lengkapi data/galeri studi kasus yang dapat diverifikasi | `content/portfolio.json`, seluruh `work/*` | Metadata dan bukti kontribusi masih terbatas; detail karya bisa kurang meyakinkan walau fungsi sudah lengkap |
| Medium | Uji Safari/iOS dan Firefox pada perangkat nyata | `dist/css/style.css`, `dist/js/main.js` | Memeriksa dukungan rendering, keyboard, touch, dan performa di luar Chrome; regresi spesifik browser belum dapat dikesampingkan |
| Low | Optimasi cutout dengan format transparan yang lebih kecil | `dist/img/alif-portrait-cutout.png`, data portrait | Mengurangi transfer Hero pada seluler; PNG besar masih dapat memperlambat pemuatan pada jaringan lambat |

Rekomendasi lanjutan ini belum diimplementasikan tanpa persetujuan/data tambahan pemilik.
