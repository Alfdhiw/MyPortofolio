# PRD 02 — Efek Animasi & Interaksi Website Portofolio

**Proyek:** MyPortofolio  
**Dokumen:** Motion & Interaction Specification  
**Versi:** 1.0 — 31 Oktober 2026  
**Sumber utama:** Video referensi pengguna (21,57 detik, 60 fps).

> **Catatan akurasi:** Video menampilkan **cuplikan yang telah diedit**. Durasi cut video bukan bukti durasi animasi halaman asli, dan tidak semua momen fade dapat dipastikan sebagai efek website (sebagian mungkin transisi edit video). Semua durasi milidetik pada PRD ini adalah **rekomendasi implementasi** agar hasilnya terasa serupa, tidak diklaim sebagai hasil pengukuran aplikasi sumber.

## 1. Tujuan motion

Motion harus membantu pengguna: memahami perpindahan section, menemukan interaksi, melihat proyek, membuka rincian layanan, dan mempertahankan orientasi saat pindah halaman. Kesan yang dituju **halus, kontemporer, cepat, bukan motion berlebihan**.

### Prinsip wajib

- Gunakan animasi hanya untuk **opacity**, **transform**, atau perubahan layout yang memang diperlukan; hindari animasi massal pada `top`, `left`, `width`, dan `box-shadow` berat.
- Jangan membuat semua section menjadi putih kosong lama seperti jeda edit video; isi harus tetap dapat diakses.
- Scroll normal berbasis tindakan pengguna; **jangan autoplay scroll** saat membuka situs.
- Hover untuk pointer halus; **semua fungsi utama dapat dijalankan via tap/keyboard**.
- Hormati `prefers-reduced-motion: reduce` tanpa menyembunyikan konten.

## 2. Motion tokens (nilai usulan)

| Token | Durasi | Easing | Penggunaan |
|---|---:|---|---|
| `--motion-instant` | 100–140 ms | ease-out | feedback ringkas ikon/warna |
| `--motion-quick` | 180–220 ms | `cubic-bezier(.2,.8,.2,1)` | hover tombol, pil, tab |
| `--motion-standard` | 280–360 ms | `cubic-bezier(.22,1,.36,1)` | buka accordion, filter kartu |
| `--motion-entrance` | 500–750 ms | `cubic-bezier(.16,1,.3,1)` | masuk section, hero |
| `--motion-route` | 280–420 ms | `cubic-bezier(.22,1,.36,1)` | navigasi detail karya |
| `--motion-stagger` | 60–90 ms per item | — | kartu dan baris pengalaman |
| `--motion-preview-follow` | faktor smoothing 0.12–0.18 | lerp | preview mengikuti pointer (desktop) |

### Batas dan ambang

- Entrance jarak translasi: 12–28 px, bukan ratusan piksel.
- Zoom pada kartu: 1 → maksimal 1.03.
- Rotasi mockup hover Experience: maksimal ±6°.
- Intersection trigger: elemen terlihat sekitar 15–25% (`threshold`), sekali per kunjungan kecuali ada alasan interaksi.
- Animasi penting tidak boleh menunda interaksi; durasi interaksi utama sebaiknya ≤ 400 ms.

## 3. Pemetaan motion berdasarkan video

| ID | Rentang video | Apa yang terlihat | Perilaku implementasi yang direkomendasikan |
|---|---|---|---|
| M-01 | 0,0–1,5 dtk | Hero terlihat, lalu putih/pudar dan elemen muncul kembali | Entrance hero bertahap; **tidak** membuat full-screen white flash yang memblokir konten |
| M-02 | 1,5–4,4 dtk | Nama dan teks terungkap, potret muncul dari bawah, penampakan foto sedikit berubah | Fade-up tipografi + portrait slide-up/mask reveal |
| M-03 | 4,5–5,7 dtk | Peralihan ke section karya dan heading terbentuk | Section reveal fade-up singkat |
| M-04 | 5,8–7,8 dtk | Kartu karya tampak muncul dan bergerak vertikal; ikon panah di atas thumbnail | Stagger cards + hover thumbnail + link detail |
| M-05 | 8,0–9,6 dtk | Section layanan dan baris muncul progresif | Stagger rows dan divider reveal ringan |
| M-06 | 9,7–10,7 dtk | Baris `UIUX DESIGN` mengembang jadi kotak gelap dengan mockup | Accordion open/close dengan layout transition |
| M-07 | 10,8–13,2 dtk | Panel Experience gelap dan daftar terungkap bertahap | Fade-in panel, header, lalu rows stagger |
| M-08 | 13,7–15,1 dtk | Gambar tiga ponsel mengambang dekat cursor pada riwayat kerja | Cursor-follow preview (desktop) dengan easing dan tilt ringan |
| M-09 | 15,4–16,6 dtk | CTA kontak muncul pada panel terang | Headline + badge + tombol entrance berurutan |
| M-10 | 16,8–18,9 dtk | Peralihan ke halaman detail, judul dan metadata muncul | Route fade, detail header cascade tanpa memblokir halaman |
| M-11 | 19,0–20,5 dtk | Pengguliran mockup proyek, `/MORE WORK`, lalu CTA | Konten detail scroll normal, gambar lazy reveal dan next works |

## 4. Spesifikasi interaksi per komponen

### AN-01 — Hero entrance

**Trigger:** kunjungan awal setelah HTML siap; harus tetap terlihat tanpa JavaScript.  
**Urutan direkomendasikan:**
1. Panel kontainer tampak stabil (tidak scale besar), opacity 0 → 1 selama 350 ms.
2. Navigasi dan badge masuk, delay 70 ms, fade-up 12 px selama 420 ms.
3. Nama muncul dalam dua lapis: kata outline diikuti kata solid, delay 120–180 ms, opacity dan `translateY(20px)` selama 600 ms.
4. Foto dipunculkan dengan `clip-path: inset(100% 0 0 0)` ke `inset(0 0 0 0)` atau transform `translateY(24px)`; durasi 650 ms. Pilih **salah satu**, hindari dua efek berat sekaligus.
5. Deskripsi kiri dan daftar sosial kanan stagger 70 ms.

**Desktop:** potret tumpang tindih dengan heading; efek tidak boleh menyebabkan perubahan ukuran layout.  
**Mobile:** sederhanakan menjadi fade-up; jangan crop wajah.  
**Kegagalan dicegah:** jangan menulis `opacity: 0` permanen yang membuat konten hilang jika skrip gagal.

### AN-02 — Tombol pil dan navigasi

- Hover: perpindahan `translateY(-2px)` atau background inversion 180 ms, ikon panah bergeser 2–4 px.
- Active/tap: `scale(0.98)` singkat; `focus-visible` harus jelas tanpa bergantung hover.
- Navbar anchor menggunakan native link `#work`, `#service`, `#experience`, `#contact`. `scroll-behavior: smooth` opsional dan harus nonaktif pada reduced motion.
- Tidak perlu sound effect, magnetic cursor, atau efek pointer mengganggu.

### AN-03 — Reveal section dan kata dekoratif

- Heading `/SELECTED WORK`, `/SERVICE`, `/EXPERIENCE`: opacity 0 → 1 + Y 20 → 0, 500–650 ms.
- Ghost heading muncul bersama section dengan opacity sangat kecil; tidak melakukan parallax agresif.
- IntersectionObserver untuk mengaktifkan class, atau Motion `whileInView`; `once: true` default.
- Konten yang sudah berada di viewport saat load tidak boleh tertahan.

### AN-04 — Filter dan hover project card

**State filter:** `all | real | exploration`.  
**Trigger:** klik/tap tab, bukan hover.  
**Reaksi:** kartu keluar dengan opacity/translasi 180 ms, kartu masuk melalui layout animation 250–350 ms; jumlah item berubah sesuai data yang terpilih.  
**Hover desktop:**
- thumbnail `scale(1.02)` selama 220–300 ms, crop tetap dengan `overflow: hidden`;
- circle CTA putih berikon `↗` menjadi terlihat (opacity + scale .9 → 1);
- card title tidak bergerak jauh, hindari gerakan yang menggeser kartu di bawahnya.

**Keyboard/mobile:** `focus-within` atau card link langsung menunjukkan affordance permanen.  
**Perubahan route:** klik menuju `/work/[slug]` (bukan modal ambigu).  
**Gambar:** setiap kartu punya `width`/`height` atau `aspect-ratio` tetap.

### AN-05 — Accordion Service

**State:** `activeServiceId: string | null`. Default: seluruh item tertutup (atau satu terbuka jika diinginkan), **maksimal satu terbuka**.

- Klik row pasif: baris terkait mengembang dalam 280–360 ms, background menjadi charcoal, teks menjadi putih, deskripsi dan mockup muncul.
- Klik row aktif, tombol `×`, atau memilih row lain: tutup baris sebelumnya; jika satu baru dipilih, buka yang baru.
- Gambar mockup masuk dengan `opacity 0 → 1`, `scale(.96 → 1)`, `rotate(-3° → -5°)` statis pada akhir (tidak terus berputar).
- Gunakan `button` dengan `aria-expanded`, `aria-controls` dan panel dengan label yang terkait.
- Layout harus ikut mengalir ke bawah; dilarang overlay yang menutupi isi baris lain, kecuali preview gambar yang memang terletak **di dalam** area accordion.
- Mobile: gambar berada di bawah deskripsi, tanpa overlap negatif berlebihan.

**Contoh state:**

```ts
type ServiceId = 'uiux' | 'web' | 'branding' | 'motion';
const [activeServiceId, setActiveServiceId] = useState<ServiceId | null>(null);
function toggleService(id: ServiceId) {
  setActiveServiceId(current => current === id ? null : id);
}
```

### AN-06 — Experience cursor-follow mockup

**Observasi:** saat pointer mendekati baris pertama, preview tiga layar ponsel terlihat mengambang, sedikit dimiringkan; jalur pergerakan pastinya tidak dapat dipastikan hanya dari video.

**Spesifikasi desktop (pointer:fine + hover:hover):**
- Hover/focus row yang punya gambar → preview muncul di sekitar pointer/row dengan fade-scale 150–220 ms.
- Posisi mengikuti pointer menggunakan koordinat relatif container dan lerp (atau spring ringan), update pada `requestAnimationFrame`.
- Batasi posisi ke dalam viewport dan jangan menutup fokus utama lebih dari perlu.
- Putar mockup −6° hingga +6°, tidak membuat animasi rotasi loop.
- `pointer-events: none` pada preview, sehingga tidak menghalangi klik baris atau link.
- Saat pointer keluar section → fade-out 140–180 ms.

**Mobile / touch / reduced motion:** tampilkan preview kecil secara statis pada baris yang dibuka dengan tap atau hilangkan preview interaktif sambil menyediakan tautan proyek.  
**Etika konten:** gambar tidak boleh tersirat sebagai pekerjaan pada merek tertentu jika bukan pengalaman nyata.

### AN-07 — Inversi ke Experience panel gelap

- Background section menjadi charcoal saat section terlihat; **bukan** mem-fade seluruh halaman melalui putih kosong.
- Heading muncul di atas teks dekoratif; baris list stagger 50–80 ms.
- Garis pemisah menggunakan opacity sederhana, tidak animasi mengisi dari ujung layar jika menambah kompleksitas.

### AN-08 — Contact closing CTA

- Badge status: fade-up 250–350 ms, tanpa dot hijau berkedip terus-menerus.
- Headline: opacity + Y 18 px, 550 ms.
- Deskripsi: delay 100 ms; CTA: delay 180 ms; social row: stagger 50 ms.
- Tombol melakukan tindakan nyata, misalnya membuka `mailto:` atau halaman/form kontak yang benar.

### AN-09 — Transisi halaman proyek

**Trigger:** pilih kartu karya / tombol Back.  
**Usulan:** route content fade-out 120–160 ms, ganti route, detail header fade-up 300–420 ms. Bila tersedia native view transitions dan kompatibilitas memadai, boleh disempurnakan tetapi **tidak wajib**.

- Jangan menunggu seluruh gambar detail selesai diunduh untuk menampilkan judul dan metadata.
- Pertahankan focus management: sesudah navigasi, fokus diarahkan masuk ke judul utama bila arsitektur router membutuhkan.
- Tombol `Back` mengarah ke daftar kerja dengan anchor atau history yang aman.
- Scroll detail biasa, tidak scroll-jacking. Gambar mockup masuk dengan opacity saja ketika terlihat.

## 5. Mesin state yang harus konsisten

| Elemen | State | Tindakan pengguna | Hasil |
|---|---|---|---|
| Navbar mobile | `closed/open` | tap menu/escape | menu toggle/tertutup |
| Tab proyek | `all/real/exploration` | click/tap | data terfilter, label aktif terlihat |
| Service accordion | `null/serviceId` | click/tap/enter | satu item terbuka atau semua tertutup |
| Experience preview | `hidden/visible` + active ID | hover/focus/tap | preview yang terkait item saja |
| Detail karya | `list/detail` via router | klik kartu/Back | route valid, state konsisten |
| Form/CTA (jika ada) | `idle/loading/success/error` | submit | feedback nyata dan dapat dipahami |

## 6. Teknologi rekomendasi

- **Dasar:** CSS transitions + transform/opacity; `IntersectionObserver` native untuk reveal dan `prefers-reduced-motion` media query.
- **Jika memakai React/Next.js:** Motion (Framer Motion) untuk layout accordion/stagger, gunakan komponen client **hanya pada bagian interaktif**.
- **GSAP/ScrollTrigger:** opsional hanya jika ada sequence kompleks yang benar-benar membutuhkannya; tidak diperlukan untuk MVP video ini.
- **Jangan menginstal tiga pustaka animasi sekaligus.** Pilih satu pustaka utama atau CSS native.

## 7. Reduced motion, aksesibilitas, performa

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Preview pointer di-disable pada coarse pointer/touch; tidak ada continuous loop.
- Animasi tidak boleh mencegah interaksi keyboard atau screen reader.
- Hindari menumpuk blur, filter grayscale animasi bersamaan dengan gambar beresolusi besar.
- Gunakan `will-change` **hanya saat interaksi berjalan**, bukan pada semua elemen.
- Target pengalaman: pada perangkat menengah, scroll tetap mulus, tanpa long frame yang terlihat jelas; uji manual di perangkat nyata.

## 8. Acceptance criteria dan tes

- [ ] Tidak ada autoplay scroll, full-page flash yang menyilaukan, atau konten hilang jika animasi gagal.
- [ ] Entrance hero memunculkan tipografi, potret, CTA dan sosial tanpa perubahan layout mencolok.
- [ ] Kartu proyek berfilter dengan state aktif yang akurat dan dapat diakses keyboard.
- [ ] Hover kartu mempunyai affordance ikon panah; tap mobile tetap bekerja.
- [ ] Service accordion membuka dan menutup satu item secara mulus, deskripsi serta gambar tetap terbaca.
- [ ] Experience preview mengikuti baris yang tepat dan tidak menangkap pointer.
- [ ] Navigasi ke detail karya dan Back sukses; browser Back juga berfungsi.
- [ ] `prefers-reduced-motion: reduce` menonaktifkan gerak nonesensial tetapi semua konten tetap tampil.
- [ ] Tidak ada memory leak dari listener pointer/intersection observer yang tertinggal setelah unmount.

## 9. Urutan pengerjaan motion

1. Semua struktur dan navigasi berfungsi **tanpa** animasi.
2. Tambahkan hover button/kartu dan accordion.
3. Tambahkan entrance reveal secukupnya.
4. Tambahkan Experience cursor-preview hanya di desktop.
5. Tambahkan route transition; lakukan audit reduced motion dan performa.

**Ketergantungan:** PRD 01 untuk token visual dan PRD 03 untuk susunan konten/data.
