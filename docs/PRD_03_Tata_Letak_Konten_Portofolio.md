# PRD 03 — Tata Letak, Arsitektur Informasi & Konten Website Portofolio

**Proyek:** MyPortofolio  
**Dokumen:** Content Layout, Information Architecture & Page Specifications  
**Versi:** 1.0 — 31 Oktober 2026  
**Sumber utama:** Video referensi pengguna (21,57 detik).

> **Panduan penting:** Nama Dymas Alfin, contoh proyek, tempat kerja, dan klaim `9+ years` di video merupakan materi referensi orang lain. Website akhir **wajib menggunakan identitas, proyek, keterampilan, dan pengalaman nyata milik pengguna**. Teks Inggris dan urutan section di sini mengikuti komposisi video, sementara data nyata disediakan sebagai placeholder yang mudah diganti.

## 1. Tujuan dan arsitektur informasi

### Target pengunjung

1. Rekruter/klien yang ingin cepat melihat profil, karya, dan cara menghubungi.
2. Kolaborator yang ingin memahami spesialisasi dan pengalaman.
3. Pengunjung yang menginginkan studi kasus lebih lengkap, bukan sekadar galeri gambar.

### Tujuan UX

- Identitas dan pekerjaan jelas dalam 5 detik pertama.
- Contoh karya terlihat tanpa harus membaca seluruh riwayat.
- Setiap kartu karya dapat dibuka ke detail yang berisi konteks, kontribusi dan gambar.
- Kontak dapat diakses dari hero, navbar, halaman detail, dan bagian akhir.
- Urutan informasi tetap logis di semua ukuran layar.

### Site map

```text
/
├── #home          Hero & navigasi
├── #work          Selected Work (filter: All / Real Project / Exploration)
├── #service       Service accordion
├── #experience    Riwayat pengalaman
└── #contact       Contact CTA & social links

/work/[slug]       Detail/studi kasus proyek (halaman terpisah)
/work              Opsional: seluruh karya, jika jumlah proyek melebihi preview
```

**MVP:** homepage (`/`) dan halaman detail (`/work/[slug]`) wajib. Halaman `/work` hanya dibuat jika tombol `View All Work` memang membutuhkan daftar terpisah; jika tidak, tombol tersebut men-scroll ke seluruh kartu atau dihilangkan.

## 2. Urutan section dan relasi dengan cuplikan video

| No. | Section | Rentang cuplikan | Konten minimum |
|---:|---|---|---|
| 01 | Hero / Home | 0,0–4,4 dtk | Navbar, status, nama, peran, bio singkat, portrait, tombol utama, social links |
| 02 | Selected Work | 4,5–7,9 dtk | Judul, filter, 4 kartu unggulan, View All Work |
| 03 | Service | 8,0–10,7 dtk | Judul, 3–4 baris layanan, ringkasan tiap layanan, mockup ilustratif |
| 04 | Experience | 10,8–15,3 dtk | Judul, ringkasan tahun, timeline karier, perusahaan/posisi/periode, optional preview |
| 05 | Contact | 15,4–16,9 dtk | Status, headline, kalimat CTA, tombol kontak, daftar sosial |
| 06 | Detail Work | 17,0–20,4 dtk | Header, identitas proyek, service/timeline/tools, visual besar, narasi, more work |
| 07 | Return to CTA | 20,5–21,57 dtk | Bagian kontak kembali tampak di montage; direalisasikan sebagai CTA akhir tiap detail |

**Catatan:** rentang waktu adalah posisi pada video, **bukan** urutan autoplay wajib, bukan durasi halaman, dan bukan perintah membuat website seperti slideshow. Website harus menggunakan scroll yang dikendalikan pengunjung.

## 3. Grid layout dasar

### Desktop (referensi 1566 × 1080)

- Background abu-abu bertema cloud/paper mengisi viewport.
- Panel terpusat maksimal sekitar 1280 px; margin luar relatif besar.
- Konten internal memakai grid 12 kolom dan gutters 24–32 px; batas konten internal sekitar 1120 px.
- Section tetap membentuk satu halaman yang dapat di-scroll, panel tidak dikunci menjadi tinggi viewport.

**Skema layout desktop:**

```text
BACKGROUND BERTEKSTUR ABU-ABU
╔══════════════════════ PANEL TERANG ══════════════════════╗
║ Badge       Work      Service      Experience    CTA      ║
║                                                            ║
║   NAMA OUTLINE / NAMA SOLID (sangat besar)                  ║
║                                                            ║
║   Job + Bio      [PORTRAIT CUTOUT TENGAH]  [SOCIAL PILLS]   ║
║   CTA                                                      ║
╚════════════════════════════════════════════════════════════╝

╔═══════════════ /SELECTED WORK ════════════════════════════╗
║                 PORTFOLIO (ghost title)                    ║
║ [All] [Real] [Exploration]            [View All Work ↗]     ║
║ ┌─────────────────────┐ ┌─────────────────────┐           ║
║ │ Thumbnail + badge   │ │ Thumbnail + badge   │           ║
║ │ Project name, tags  │ │ Project name, tags  │           ║
║ └─────────────────────┘ └─────────────────────┘           ║
║ ┌─────────────────────┐ ┌─────────────────────┐           ║
║ │ Thumbnail + badge   │ │ Thumbnail + badge   │           ║
║ │ Project name, tags  │ │ Project name, tags  │           ║
║ └─────────────────────┘ └─────────────────────┘           ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════ /SERVICE ════════════════════════════╗
║ [UI/UX DESIGN                   ↗]                         ║
║ [WEB DESIGN & DEVELOPMENT        ↗]                        ║
║ [BRANDING                       ↗]                         ║
║ [MOTION & ANIMATION              ↗]                        ║
║ (Baris aktif berkembang jadi panel gelap + gambar)        ║
╚════════════════════════════════════════════════════════════╝

╔═══════════════════ EXPERIENCE (DARK) ═════════════════════╗
║ /EXPERIENCE                        [n years of experience] ║
║ [Organization + role]                    [Date range]      ║
║ ────────────────────────────────────────────────────────   ║
║ [Organization + role]                    [Date range]      ║
║                     [Floating preview on hover]            ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════ CONTACT ═════════════════════════════╗
║                    [Availability badge]                    ║
║                 HAVE A PROJECT IN MIND?                    ║
║                     Supporting sentence                    ║
║                        [Contact Me ↗]                      ║
║ [Avatar + Name]  [Dribbble] [Instagram] [LinkedIn] [...]    ║
╚════════════════════════════════════════════════════════════╝
```

### Mobile

**Urutan yang dipertahankan:** Badge/menu → nama → portrait → pekerjaan/bio → CTA → social links → work → service → experience → contact. Urutan visual boleh menempatkan job/bio sebelum foto jika lebih mudah dibaca, tetapi urutan semantik DOM harus masuk akal.

- Header dua area: status/brand + menu button. Menu link bisa dalam drawer/expandable overlay dengan fokus terkelola.
- Nama besar dibungkus menjadi 2 baris; kata outline dan solid dipertahankan bila terbaca.
- Portrait maksimal 80–90% lebar, tidak melewati tepi panel.
- Semua project cards dalam 1 kolom.
- Experience: periode turun ke bawah jabatan atau rata kiri, jangan memaksa dua kolom sempit.
- Detail: metadata `Service / Timeline / Tools` ditumpuk setelah title dan deskripsi, sebelum gambar utama.

## 4. Detail per section

### S01 — Hero

**Prioritas informasi:** siapa → melakukan apa → mengapa relevan → bisa dihubungi.  
**Elemen konten:**

| Field | Wajib | Batas rekomendasi | Komponen |
|---|---|---|---|
| `fullName` | Ya | Nama asli/nama profesional; idealnya muat 1–2 baris | H1 outline + solid |
| `role` | Ya | 2–5 kata | Subheadline |
| `shortBio` | Ya | 90–160 karakter | Deskripsi singkat |
| `portrait` | Ya | PNG/WebP background transparan | Cutout tengah |
| `availableForWork` | Ya | Boolean dan label jelas | Status badge |
| `primaryContact` | Ya | URL/email yang valid | CTA utama |
| `socialLinks[]` | Opsional | Maksimal 4–5 yang relevan | Pil sosial |
| `navCounts` | Otomatis | Turunan dari panjang array data | Angka di navbar |

**Batasan:** jangan menyalin foto/nama Dymas Alfin. Label `Available for New Project` hanya boleh aktif jika sesuai kondisi sebenarnya; alternatif `Open to Collaboration` atau menghilangkannya.

### S02 — Selected Work

**Struktur:** ghost word → H2 `/SELECTED WORK` → filter + CTA → kartu 2×2 desktop → bila perlu proyek berikutnya.

**Field setiap kartu:** `id`, `slug`, `title`, `category`, `projectType` (`real | exploration`), `studioOrClient?`, `coverImage`, `coverAlt`, `tags[]`, `featured`, `order`, `published`.

**Contoh referensi yang terlihat (BUKAN konten default):**
- BloomCare — Mental Health App Landing Page.
- FragWater — Luxury Fragrance Landing Page.
- CryptoCalm — Crypto Investment Dashboard for Beginners.
- Spenso — Redefining Personal Finance with AI.

**Aturan filter:**
- `All` → semua featured yang diterbitkan.
- `Real Project` → hanya `projectType = real`.
- `Exploration` → hanya `projectType = exploration`.
- Tombol `View All Work` membuka daftar lengkap jika tersedia. Bila tidak, sederhanakan: semua proyek tampil pada section dengan pagination/load more yang benar-benar berfungsi.
- Urutan kartu dikendalikan `order`, bukan urutan nama file.
- Jika tak ada hasil, tampilkan empty state (`Belum ada karya pada kategori ini`).

### S03 — Service

**Struktur:** ghost word → heading → daftar accordion. Setiap service berisi `title`, `summary`, `mockupImage`, `mockupAlt`, `order` dan opsional `capabilities[]`.  
**Contoh kategori dari video:** UI/UX Design, Web Design & Development, Branding, Motion & Animations.  
**Batas konten:** summary aktif 1–3 kalimat (sekitar 100–220 karakter); jangan membuat teks terlalu banyak dalam blok yang singkat.

**Perilaku layout:** satu item expanded tetap berada dalam aliran dokumen. Image mockup boleh menempel dekat tepi kanan panel desktop, sedangkan mobile berada setelah deskripsi. Tinggi setiap item menyesuaikan isi, tidak fixed.

### S04 — Experience

**Struktur:** panel dark → ghost word → H2 `/EXPERIENCE` + ringkasan pengalaman → daftar timeline.

**Field tiap entri:** `organization`, `role`, `startDate`, `endDate?`, `isCurrent`, `description?`, `previewImage?`, `link?`, `order`.

**Aturan akurasi:**
- Urutkan pengalaman terbaru ke terlama.
- Teks rentang waktu dibangkitkan otomatis dari tanggal (contoh `Jan 2024 – Present`).
- `X years of experience` dihitung dari data yang dapat dipertanggungjawabkan atau ditulis manual berdasarkan pengalaman relevan; **jangan otomatis menjumlahkan periode yang tumpang tindih**.
- Data perusahaan yang ditampilkan dalam video tidak digunakan tanpa hubungan faktual pengguna.
- Jika belum punya pengalaman kerja formal: gunakan `Selected Collaborations`, `Projects`, atau `Journey` dengan data nyata. Tidak perlu memalsukan perusahaan.

### S05 — Contact

**Struktur:** status → H2 besar → copy singkat → tombol utama → baris avatar dan sosial.

**Contoh copy referensi:** `HAVE A PROJECT IN MIND?`.  
**Konten minimum:** `contactHeadline`, `contactBody` (maksimal 2 kalimat), `contactUrl`/email, `socialLinks`, `displayName`, `avatar`.  
**Opsional:** waktu respon, lokasi umum, preferred platform. **Jangan menjanjikan waktu respon jika tidak dapat dipenuhi.**

### S06 — Detail /work/[slug]

**Layout desktop:**

```text
╔══════════════════ CASE STUDY PANEL ═══════════════════════╗
║ [← Back]                               [Availability badge] ║
║                                                              ║
║ [Category chip] [Studio chip]              Service            ║
║ [PROJECT TITLE]  /Real Project             UX / Web            ║
║ Short description                         Timeline           ║
║ [Live Preview ↗] [Contact Me]              Tools [icon] [icon] ║
║                                                              ║
║ ┌──────────────── Full-width hero mockup ─────────────────┐ ║
║ └──────────────────────────────────────────────────────────┘ ║
║ [Overview] [Design rationale / role] [Process] [Result]      ║
║ [Large screenshot / media]   [Additional screenshots]        ║
║                            /MORE WORK                        ║
║                       [Related cards]                        ║
║                       [Contact CTA]                          ║
╚══════════════════════════════════════════════════════════════╝
```

**Field detail:**
- `title`, `slug`, `category`, `projectType`, `studioOrClient?`, `summary`, `services[]`, `timelineText?`, `tools[]`, `coverImage`, `galleryImages[]`, `sections[]`, `liveUrl?`, `contactUrl`, `relatedSlugs?`, `published`.
- `sections[]`: tiap blok memiliki `heading`, `paragraphs[]`, dan `images[]` opsional; urutannya dikontrol data.
- `Live Preview` **hanya tampil jika URL valid**; jangan menautkan ke `#`.
- `Timeline` hanya diberikan jika waktu proyek diketahui; lebih baik `Not specified` di panel editor tetapi disembunyikan dari halaman publik.
- `Tools` hanya teknologi/aplikasi yang benar-benar dipakai.
- Foto dan mockup mempunyai caption/alt text relevan.
- `More Work` mengecualikan proyek yang sedang dibaca dan menampilkan 2–3 karya lain.

**Narasi studi kasus direkomendasikan (tidak semua terlihat eksplisit dalam video):** tantangan → tanggung jawab → pendekatan → solusi → dampak. Jika tidak ada metrik hasil nyata, tulis observasi kualitatif tanpa angka rekaan.

## 5. Model data untuk AI Codex

Gunakan data terpusat agar konten bisa diganti tanpa menyentuh komponen UI. Berikut skema TypeScript konseptual (sesuaikan dengan stack aktual):

```ts
type ProjectType = 'real' | 'exploration';

type MediaAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  projectType: ProjectType;
  studioOrClient?: string;
  summary: string;
  coverImage: MediaAsset;
  galleryImages: MediaAsset[];
  tags: string[];
  services: string[];
  tools: string[];
  timelineText?: string;
  liveUrl?: string;
  sections: Array<{
    id: string;
    heading: string;
    paragraphs: string[];
    images?: MediaAsset[];
  }>;
  featured: boolean;
  published: boolean;
  order: number;
};

type Service = {
  id: string;
  title: string;
  summary: string;
  mockupImage?: MediaAsset;
  capabilities?: string[];
  order: number;
};

type Experience = {
  id: string;
  organization: string;
  role: string;
  startDate: string; // YYYY-MM
  endDate?: string;  // YYYY-MM; kosong jika masih berlangsung
  isCurrent: boolean;
  description?: string;
  previewImage?: MediaAsset;
  link?: string;
  order: number;
};

type Profile = {
  fullName: string;
  outlinePart: string;
  solidPart: string;
  role: string;
  shortBio: string;
  portrait: MediaAsset;
  avatar?: MediaAsset;
  availableForWork: boolean;
  primaryContact: string;
  socialLinks: Array<{ label: string; url: string; icon: string }>;
  contactHeadline: string;
  contactBody: string;
};
```

**Data storage MVP:** file TypeScript/JSON atau Markdown/MDX lokal; CMS/database **tidak diperlukan** hanya untuk menyajikan portofolio statis. Jika situs nanti sering diperbarui non-developer, baru pertimbangkan CMS.

## 6. Panduan pengelolaan aset

```text
public/
  images/
    background/
      cloudy-paper.webp
    profile/
      portrait.webp
      avatar.webp
    projects/
      [slug]/
        cover.webp
        hero.webp
        detail-01.webp
        detail-02.webp
    services/
      uiux-preview.webp
      web-preview.webp
    experience/
      [organization]-preview.webp
```

- Rasio cover proyek diseragamkan (saran 4:3 atau 1.5:1), tetapi isi screenshot tidak didistorsi; gunakan `object-fit: cover` hanya pada thumbnail.
- Potret hero cutout memakai alpha/transparansi.
- Teks dalam screenshot bukan pengganti judul/card title yang ditulis HTML.
- Gambar lazily-loaded kecuali portrait dan hero yang berada di bagian awal.
- Siapkan placeholder netral untuk entri yang belum punya visual; jangan menggunakan gambar perusahaan lain secara menyesatkan.

## 7. Standar navigasi dan semantik

- Tepat satu `<h1>` pada setiap halaman: nama pada homepage, judul proyek pada detail.
- Section headings memakai `<h2>`; heading sekunder studi kasus memakai `<h3>` bila sesuai hierarki.
- Navbar memakai `<nav aria-label="Primary">`; section memiliki `id` stabil.
- Service accordion memakai tombol, bukan `<div onClick>`.
- Kartu karya memakai link semantik; jangan membungkus beberapa tautan bertingkat dalam satu link.
- Tab filter memakai pola tab yang aksesibel atau tombol filter dengan status `aria-pressed`.
- Semua link ke domain eksternal memiliki label jelas; pastikan URL yang disimpan valid.
- Tidak ada CTA palsu. Media sosial disembunyikan jika datanya kosong.

## 8. Persyaratan fungsional (prioritas)

| ID | Prioritas | Kebutuhan | Kriteria selesai |
|---|---|---|---|
| FR-01 | P0 | Menampilkan profil asli pengguna | Nama, role, bio, portrait dari data terpusat |
| FR-02 | P0 | Navigasi section | Work/Service/Experience/Contact mengarah benar |
| FR-03 | P0 | Katalog karya dan filter | Kategori menampilkan data tepat, tanpa reload wajib |
| FR-04 | P0 | Detail karya | URL slug valid dan konten spesifik per proyek |
| FR-05 | P0 | Accordion layanan | Buka/tutup sesuai state; aksesibel keyboard |
| FR-06 | P0 | CTA kontak | Email/link valid dan dapat diaktifkan |
| FR-07 | P0 | Responsive | Tidak overflow di mobile; layout 1 kolom |
| FR-08 | P1 | Hover preview pengalaman | Desktop aktif, mobile punya fallback |
| FR-09 | P1 | Related works | Tidak menampilkan proyek saat ini |
| FR-10 | P1 | Metadata SEO dan OG | Title/description per halaman dan share image |
| FR-11 | P2 | CMS / blog / analytics | Hanya setelah MVP valid |

## 9. Checklist konten yang harus disiapkan pemilik website

- [ ] Nama profesional, peran dan bio singkat.
- [ ] Portrait transparan + avatar persegi.
- [ ] Status kesediaan bekerja sama yang sebenarnya.
- [ ] Minimal 3–4 karya asli lengkap dengan thumbnail, ringkasan, tugas/peran, dan 2–4 screenshot relevan.
- [ ] Kategori dan jasa yang memang ditawarkan.
- [ ] Pengalaman kerja/organisasi/kolaborasi yang benar dan dapat dipertanggungjawabkan.
- [ ] Link sosial aktif dan email/kanal kontak.
- [ ] Bukti nyata untuk klaim hasil (angka konversi, traffic, penghargaan) jika ingin dicantumkan.
- [ ] Izin publikasi proyek dari klien bila kontennya tidak sepenuhnya milik sendiri.

## 10. Definition of Done dan alur implementasi

**Selesai bila:**
- [ ] Homepage memuat S01–S05 dalam urutan yang ditetapkan.
- [ ] Tiap featured project mengarah ke halaman detail yang sesuai.
- [ ] Detail memuat judul/metadata/gambar/isi dan bagian More Work/Contact.
- [ ] Semua angka di menu diturunkan dari data nyata, bukan hardcoded video (`40`, `4`, `9+`).
- [ ] Section dan detail tetap masuk akal jika ada data kosong atau lebih banyak item.
- [ ] Desain mobile, tablet, desktop diverifikasi dengan konten panjang/pendek.
- [ ] Tidak ada gambar dummy, lorem ipsum, atau tautan mati di rilis produksi.
- [ ] Navigasi browser Back, anchor section, keyboard, dan pembaca layar dasar berfungsi.

**Urutan sprint yang disarankan:**
1. Model data + profil + aset & komponen desain (PRD 01).
2. Homepage Hero dan Work + detail dinamis `/work/[slug]`.
3. Service, Experience, Contact + responsive.
4. Animasi/hover/route transition menurut PRD 02.
5. Audit aksesibilitas, performa, konten nyata, SEO, dan rilis.

## 11. Keputusan yang tidak boleh berubah diam-diam oleh AI Codex

- Struktur halaman tetap **homepage satu halaman dengan anchor + halaman detail proyek per slug**.
- Warna utama **monokrom** dan latar bertekstur; tidak menambah gradient neon global atau glassmorphism.
- Data nyata pengguna disimpan terpisah dari komponen, tidak menanam data contoh referensi ke UI final.
- Tidak memakai carousel otomatis sebagai pengganti scroll homepage.
- Tidak memasukkan backend, login, CMS, atau database tanpa kebutuhan produk nyata.
- Tidak menggunakan video referensi sebagai video background karena referensinya adalah tampilan website, bukan aset latar.
- Perubahan struktur, teknologi, atau library animasi harus mempunyai alasan implementasi tertulis, bukan keputusan spontan.

**Ketergantungan:** PRD 01 (visual) dan PRD 02 (gerak/interaksi).
