# PRD 01 — Desain Visual Website Portofolio

**Proyek:** MyPortofolio  
**Dokumen:** Visual Design System & UI Specification  
**Versi:** 1.0 — 31 Oktober 2026  
**Status:** Siap menjadi acuan desain dan implementasi  
**Sumber utama:** Video referensi yang diberikan pengguna (21,57 detik; 1566 × 1080 px; 60 fps).

> **Batasan bukti:** Video adalah rangkaian cuplikan visual, bukan file desain atau source code. Rincian yang terlihat dinyatakan sebagai **Observasi**, sedangkan ukuran CSS, nilai warna, breakpoint, dan teknik implementasi adalah **Spesifikasi usulan**. Jangan menganggap identitas, proyek, perusahaan, maupun jumlah tahun pengalaman dalam video sebagai data milik pemilik website ini.

## 1. Ringkasan produk

Website portofolio personal bergaya **editorial, premium, minimalis, monokrom**, dengan aksen hijau kecil untuk menandakan ketersediaan kolaborasi. Tujuan: pengunjung dapat memahami identitas dan spesialisasi, melihat proyek unggulan, mengenali layanan serta pengalaman, lalu menghubungi pemilik portofolio. Detail proyek memiliki halaman studi kasus terpisah.

**Karakter visual wajib:**
- Bingkai konten besar berwarna putih/off-white, terpusat di atas latar belakang abu-abu bertekstur awan/kertas.
- Judul sangat besar, sans-serif, huruf kapital, kombinasi **outline** dan **solid** pada hero.
- Kontras terang–gelap kuat; satu bagian **Experience** tampil sebagai panel charcoal penuh.
- Kata dekoratif berukuran besar dan sangat pudar di belakang judul setiap section: `PORTFOLIO`, `SERVICE`, `EXPERIENCE`.
- Tombol berbentuk pil, border tipis, panah diagonal kanan-atas; jarak dan ruang kosong luas.
- Kartu karya berfokus pada visual mockup; tipografi berhierarki tegas.
- Interaksi disediakan, tetapi tidak boleh mengorbankan keterbacaan dan performa.

## 2. Penelusuran visual ke video

| Perkiraan cuplikan | Observasi yang terlihat | Dampak pada desain |
|---|---|---|
| 0,0–4,4 dtk | Hero dengan navbar, badge ketersediaan, nama outline/solid, potret di tengah, jabatan kiri dan media sosial kanan | Hero desktop tiga zona pada satu panel |
| 4,5–7,9 dtk | `PORTFOLIO` samar, heading `/SELECTED WORK`, filter dan grid proyek dua kolom | Section proyek dengan filter dan kartu visual |
| 8,0–10,7 dtk | `/SERVICE`, baris layanan, satu baris menjadi panel gelap berisi gambar dan tombol tutup | Accordion layanan yang ekspansif |
| 10,8–15,3 dtk | Panel gelap `/EXPERIENCE`, riwayat kerja dua kolom dan preview mockup mengambang saat hover | Kontras inversi & hover preview |
| 15,4–16,9 dtk | CTA `HAVE A PROJECT IN MIND?`, tombol kontak, deretan tautan sosial | Bagian kontak berfokus pada konversi |
| 17,0–20,4 dtk | Detail `FragWater`: tombol Back, badge, kategori, judul, ringkasan, layanan, durasi, tools, mockup panjang | Template halaman studi kasus |
| 20,5–21,57 dtk | Kembali ke tampilan penutup/CTA di atas latar tekstur | Penutup yang konsisten dengan homepage |

Cuplikan tersebut **bukan** bukti bahwa tiap pergantian berlangsung otomatis atau memiliki durasi yang sama pada situs asli.

## 3. Design tokens (usulan implementasi)

### 3.1 Palet warna

| Token | HEX | Fungsi |
|---|---|---|
| `--color-page` | `#C9C9C9` | Kanvas di belakang panel utama; diberi tekstur ringan |
| `--color-surface` | `#F8F8F8` | Panel halaman dan section terang |
| `--color-surface-elevated` | `#FFFFFF` | Tombol putih, chips, elemen terangkat |
| `--color-ink` | `#1A1A1A` | Headline, body utama, tombol gelap |
| `--color-dark-section` | `#242424` | Latar Experience dan accordion aktif |
| `--color-ink-inverse` | `#F7F7F7` | Teks pada latar gelap |
| `--color-muted` | `#7A7A7A` | Metadata, subteks dan label pelengkap |
| `--color-line` | `#D9D9D9` | Pemisah, outline chips/kartu |
| `--color-ghost` | `#ECECEC` | Tipografi dekoratif besar pada panel terang |
| `--color-ghost-dark` | `#303030` | Tipografi dekoratif di panel gelap |
| `--color-status` | `#2EDC72` | Titik indikator available (satu-satunya aksen cerah) |

**Aturan warna:** Sebagian besar tampilan harus tetap netral. Warna cerah pada screenshot proyek boleh muncul **di dalam gambar proyek**, bukan mengubah warna global website. Jangan menerapkan tekstur berat di belakang body text.

### 3.2 Tipografi

- **Observasi:** Font grotesk/sans-serif modern, stroke tegas, judul kapital tanpa ornamen. Font spesifik **tidak dapat dipastikan** dari video.
- **Pilihan implementasi:** `Inter`, dengan `Arial, Helvetica, sans-serif` sebagai fallback. Gunakan satu keluarga utama agar konsisten.
- Hero nama desktop: `clamp(4rem, 9.2vw, 10rem)`, weight 700–800, `line-height: .95`, `letter-spacing: -0.055em`, `white-space` dipertimbangkan hanya jika ruang cukup.
- Segmen nama outline: `color: transparent; -webkit-text-stroke: 1.5px var(--color-ink)`; fallback untuk browser tanpa dukungan harus tetap terbaca.
- Section title: `clamp(2.25rem, 4.5vw, 4.2rem)`, weight 600–700; prefix `/` termasuk konten visual.
- Kata dekoratif: `clamp(5rem, 11vw, 10rem)`, weight 700, opacity rendah; `aria-hidden="true"`.
- Judul daftar layanan: `clamp(1.8rem, 4vw, 3.5rem)`; nama proyek: `clamp(1.2rem, 2vw, 1.65rem)`.
- Teks biasa: 16–18 px; metadata 13–15 px; jarak baris 1.45–1.65. **Jangan menyalin ukuran teks yang tampak sangat kecil akibat video diperkecil.**

### 3.3 Spacing, ukuran dan permukaan

- Base spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px.
- Lebar panel utama desktop: `min(1280px, calc(100% - 64px))`; lebar content internal: `min(1120px, 100% - 96px)`.
- Bentuk panel desktop: radius 8–12 px; mobile 0–12 px (boleh edge-to-edge pada layar kecil).
- Pada frame 1566 px, panel teramati sekitar 1.240–1.250 px dengan margin samping ~120 px. **Ini referensi visual, bukan ukuran wajib semua viewport.**
- Padding section desktop: 64–80 px horizontal, 72–112 px vertikal; tablet 32–48 px; mobile 20–24 px.
- Border: 1 px warna `--color-line`; shadow lembut hanya pada pil/mocking preview, tanpa glassmorphism berat.
- Tombol pil: height minimal 42–48 px (target sentuh sekurang-kurangnya 44 × 44 px), radius 9999 px, ikon panah ↗.
- Grid karya: desktop 2 kolom, gap 24–32 px; mobile 1 kolom, gap 24 px.

## 4. Spesifikasi komponen

### UI-01 — Kanvas dan panel
- **Observasi:** Tekstur abu-abu awan/kertas menutupi background luar; hampir semua scene menggunakan panel terang di tengah.
- Implementasi: `body` memakai tekstur statis/WebP yang ringan, overlay noise rendah (opsional), panel dengan background padat. Jangan menganimasikan noise pada tiap frame.
- Konten utama menggunakan **scroll dokumen biasa**, bukan menahan semua section dalam viewport fixed yang menyebabkan scroll di dalam scroll.

### UI-02 — Navbar pada Hero
- Kiri: status `Available for New Project` dan dot hijau.
- Tengah/kanan: `Work [jumlah]`, `Service [jumlah]`, `Experience [lama]`, `Contact`.
- Paling kanan: CTA gelap `Let's Talk ↗`.
- Desktop navbar satu baris; mobile mengganti kelompok tautan dengan menu yang memiliki label serta status buka/tutup aksesibel. Jumlah dari data nyata (bukan angka contoh).

### UI-03 — Hero identitas
- Nama besar berformat dua gaya: kata pertama outline dan kedua solid.
- Portrait potongan badan (cutout) berada di tengah, bagian bawah menyentuh dasar panel, dan menumpang di depan area nama.
- Kiri bawah: jabatan profesional, deskripsi 1–2 kalimat, tombol `Let's collaborate ↗`.
- Kanan bawah: pil tautan Dribbble/Instagram/LinkedIn/Behance **sebagai contoh dari video**, hanya tampilkan kanal yang benar-benar dimiliki pengguna.
- Warna foto terutama hitam-putih; penggunaan foto berwarna pada beberapa frame kemungkinan efek transisi dan tidak wajib.
- Gunakan foto sendiri dengan background transparan, alt text informatif, dan ukuran adaptif. Jangan memakai potret orang dalam video.

### UI-04 — Selected Work
- Header: ghost text `PORTFOLIO`, heading `/SELECTED WORK` di depan, filter `All`, `Real Project`, `Exploration` pada baris kontrol, tombol `View All Work ↗`.
- Kartu: thumbnail mockup rasio konsisten, badge kategori di atas gambar, nama proyek 1–2 baris, tags pil kategori/studio/stack.
- Efek hover berupa lingkaran putih berikon panah pada gambar, perubahan elevasi halus. Kartu klik menuju detail studi kasus.
- Gunakan karya asli pengguna; contoh judul dalam video (BloomCare, FragWater, CryptoCalm, Spenso) hanya referensi komposisi.

### UI-05 — Service
- Heading `/SERVICE` dengan ghost text `SERVICE`.
- Daftar baris besar dipisahkan hairline. Video menampilkan `UIUX DESIGN`, `WEB DESIGN & DEV`, `BRANDING`, dan baris `MOTIONS & ANIMATIONS` yang muncul ketika daftar bergerak ke bawah.
- Baris aktif menjadi blok gelap berisi judul putih, deskripsi singkat, mockup visual terangkat dan ikon `×` untuk menutup.
- Baris pasif menampilkan judul hitam dan ikon `↗` di sisi kanan. Spasi antarbaris tetap konsisten.

### UI-06 — Experience
- Section **inverted** charcoal penuh; heading putih `/EXPERIENCE`; ghost text abu gelap; label jumlah pengalaman di kanan.
- Daftar vertikal: kolom kiri `nama organisasi` + `jabatan`; kolom kanan periode, dipisahkan garis horizontal tipis.
- Hover desktop dapat menampilkan preview visual mengambang yang sedikit miring; pada mobile gunakan thumbnail yang tampil dalam baris aktif atau dialog ringan, **bukan** preview mengikuti cursor.
- Pengalaman kerja hanya ditampilkan jika benar; jangan menggunakan daftar perusahaan atau klaim masa kerja di video sebagai konten website.

### UI-07 — Contact / Closing CTA
- Panel terang dengan tekstur cloud internal yang sangat halus.
- Tengah: badge status, headline `HAVE A PROJECT IN MIND?`, paragraf satu–dua baris, CTA gelap `Contact Me ↗`.
- Bawah: pil nama/foto avatar, diikuti media sosial sejajar. Mobile menjadi wrapping atau stack tanpa teks terpotong.
- CTA wajib punya destinasi valid (email, tautan kontak, atau form yang benar-benar mengirim).

### UI-08 — Halaman detail karya
- Kontainer terang pada latar bertekstur, sama seperti homepage.
- Kiri atas `← Back`, kanan atas badge status.
- Area informasi: chips kategori dan klien/studio, judul besar, label kategori proyek, ringkasan, `Live Preview ↗`, `Contact Me`.
- Kolom samping: `Service`, `Timeline`, `Tools`.
- Di bawahnya: hero mockup besar, narasi studi kasus dan visual yang berselang-seling, `/MORE WORK`, CTA penutup.
- Klik Back kembali ke halaman asal bila memungkinkan; fallback ke `/` bagian `#work`.

## 5. Responsive rules

| Lebar | Tata letak | Perilaku penting |
|---|---|---|
| ≥ 1200 px (desktop besar) | Panel 1120–1280 px; grid 2 kolom; portrait di tengah | Headline outline/solid satu garis jika cukup; preview hover aktif |
| 768–1199 px (tablet/laptop) | Panel fluid; grid 2 kolom jika kartu ≥ 280 px; padding diperkecil | Tipografi dan portrait mengecil; navbar dapat collapse |
| ≤ 767 px (mobile) | Panel hampir edge-to-edge; grid karya 1 kolom | Heading nama boleh 2 baris; portrait berada setelah headline atau di tengah; sosial wrapping; hover diganti tap |
| ≤ 360 px (small mobile) | Semua kolom 1; padding 16–20 px | Tidak ada overflow horizontal; CTA dan tombol aksesibel |

## 6. Aksesibilitas dan performa visual

1. Semua tulisan bermakna harus punya kontras memadai (target WCAG AA); ghost heading **tidak** boleh menjadi satu-satunya label.
2. Indikator status hijau harus disertai teks, bukan hanya warna.
3. Seluruh tombol, filter, card link dan accordion dapat digunakan keyboard dengan focus ring terlihat.
4. Gunakan `loading="lazy"` untuk mockup di bawah fold, media ukuran responsif, AVIF/WebP bila tersedia.
5. Batasi latar bertekstur; jangan memakai background video loop untuk meniru cloud statis.
6. Pertahankan rasio gambar agar layout tidak melompat (CLS).
7. Foto dan karya dalam video tidak otomatis menjadi aset yang boleh digunakan ulang; siapkan materi original.

## 7. Penerimaan (acceptance criteria)

- [ ] Kesan pertama selaras dengan referensi: monokrom, panel terpusat, latar bertekstur, tipografi editorial besar.
- [ ] Hero memiliki komposisi nama outline/solid, portrait tengah, deskripsi kiri dan sosial kanan pada desktop.
- [ ] Semua section utama memiliki heading dan ruang putih yang konsisten.
- [ ] Grid 2 kolom desktop dan 1 kolom mobile tanpa clipping atau horizontal scroll.
- [ ] Accordion aktif berubah gelap dan memperlihatkan deskripsi + mockup.
- [ ] Experience menggunakan panel gelap dan daftar periodisasi yang dapat dibaca.
- [ ] Halaman detail memperlihatkan informasi ringkas + visual proyek dan navigasi kembali.
- [ ] Semua data profil, tautan, karya, dan riwayat dapat diganti dari satu konfigurasi/kumpulan data.
- [ ] Tampilan pada 360, 390, 768, 1024, 1440 dan 1920 px telah diperiksa.

## 8. Di luar lingkup versi 1

CMS, autentikasi admin, multi-bahasa, halaman blog penuh, animasi 3D/WebGL, pengambilan data otomatis dari platform sosial, dan editor visual online. Fitur ini hanya dikembangkan setelah fungsi portofolio utama stabil.

## 9. Ketergantungan dokumen

- **PRD 02 — Efek Animasi & Interaksi:** state, durasi, pemicu, reduced motion, dan transisi.
- **PRD 03 — Tata Letak & Konten:** urutan section, data schema, prioritas konten, per halaman dan perilaku responsif.
