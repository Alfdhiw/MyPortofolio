# Konten studi kasus

Pembaruan: 31 Oktober 2026. Sumber konten: `content/portfolio.json`; output halaman: `work/*/index.html` melalui `npm run build`.

## Lingkup pembaruan

Kelima proyek menggunakan struktur narasi yang sama, dengan isi spesifik: Overview → The challenge → My role & scope → Interface approach → Key features → Outcome. Karind menjadi contoh paling terperinci. Caption ditambahkan pada screenshot yang sudah ada; tidak dibuat galeri tambahan dari gambar yang tidak berhubungan.

Pemilik mengonfirmasi peran programmer full stack serta rentang pengerjaan umum 1–3 minggu, bergantung kesulitan. Karena tidak ada tanggal atau catatan durasi individual, metadata memakai `1–3 weeks (typical project range)`, bukan tanggal pasti. `role` merupakan metadata opsional dan tetap disembunyikan jika tidak diisi. Pada Matsuri Castle, narasi membedakan peran profesional full stack dari bukti proyek yang tersedia berupa frontend statis.

Narasi tantangan dan pendekatan merupakan pembacaan struktur antarmuka yang terlihat, bukan klaim riset pengguna, wawancara klien, atau rekonstruksi proses pengembangan. Outcome adalah hasil antarmuka yang dapat diamati, tanpa angka konversi, transaksi, penghematan waktu, atau pertumbuhan pengguna yang belum dibuktikan.

## Bukti per proyek

| Proyek | Sumber | Informasi yang dapat dipakai |
|---|---|---|
| Karind | Screenshot `dist/img/portfolio/karind.png` dan deskripsi pemilik sebelumnya | Home/Store/Ticketing/Studio/Talent; search produk/lagu/event/artis; Masuk/Daftar; pesan distribusi musik, merchandise, dan tiket konser |
| Matsuri Castle | Screenshot `dist/img/portfolio/matsuri2.png`; [README repositori](https://github.com/Alfdhiw/Web-MatsuriCastle/blob/master/README.md); [source HTML](https://github.com/Alfdhiw/Web-MatsuriCastle/blob/master/index.html); [halaman publik](https://alfdhiw.github.io/Web-MatsuriCastle/) | Landing page restoran; fotografi makanan; section navigasi, pengenalan, kontak, alamat; import HTML/CSS/JavaScript, Bootstrap, jQuery, dan Owl Carousel. Source mempertahankan kredit penulis template asli; tidak diklaim sebagai desain template orisinal. Screenshot lokal dan source terbit dapat berbeda versi |
| Pasar Iwak | Screenshot `dist/img/portfolio/pasariwak.PNG` dan deskripsi lama `second.html` | Marketplace ikan air tawar dengan fokus Kendal; kategori Ikan/Pakan/Bibit; search, cart, akun; promosi lelang, rekomendasi penjual, serta tautan forum |
| SIMONE | Screenshot `dist/img/portfolio/simone.PNG` dan deskripsi lama `second.html` | Sistem magang online Pengadilan Negeri Semarang; Login/Read more; teks pengantar menyebut absensi, nilai, kuota, sertifikat. Penyebutan kemampuan di pengantar tidak dianggap sebagai pengujian fungsi backend |
| SICULI | Screenshot `dist/img/portfolio/siculi.PNG` dan deskripsi lama `second.html` | Sistem cuti Pengadilan Negeri Semarang; dashboard admin, ringkasan status, tabel permohonan dengan search/pagination, serta navigasi organisasi. Jumlah dalam screenshot bukan metrik keberhasilan proyek |

### Tujuan tautan eksternal

- Matsuri Castle: halaman GitHub Pages dan repositori dapat dibaca saat pembaruan.
- Karind: `https://staging.karind.id` dipertahankan sesuai instruksi pemilik. Percobaan akses saat pembaruan gagal pada resolusi DNS; status deployment belum dapat dipastikan. Tidak dianggap sebagai proyek yang sudah diuji end-to-end.
- Pasar Iwak: pembacaan `https://pasariwak.com/demo/market/` mengembalikan halaman penjualan domain/lander, bukan marketplace yang direkam dalam screenshot. `liveUrl` dihapus dari data aktif agar CTA tidak mengarahkan pengunjung ke tujuan berbeda. Percobaan ulang kemudian timeout. URL lama dicatat hanya di sini untuk penelusuran, bukan sebagai live preview.
- SIMONE/SICULI: tidak ditambahkan URL publik atau akses ke sistem internal.

## Data yang masih perlu konfirmasi pemilik

1. Stack/framework Karind, Pasar Iwak, SIMONE, dan SICULI. Field `tools` tetap `[]`; tidak diturunkan dari daftar keterampilan profil.
2. Modul dan kontribusi teknis pribadi yang lebih rinci, pembagian kerja tim, dan durasi aktual per proyek. Rentang umum tidak diperlakukan sebagai timeline historis.
3. Hasil terukur yang boleh dipublikasikan, jika tersedia. Outcome saat ini bersifat kualitatif.
4. Screenshot tambahan yang sudah disetujui untuk publikasi. Galeri tetap kosong; penambahan screenshot internal harus memeriksa izin dan data pribadi terlebih dahulu.
5. Tujuan live preview Karind yang aktif dan URL pengganti Pasar Iwak, bila masih tersedia.

## Dampak dan verifikasi

- Perubahan data menghasilkan ulang homepage dan lima halaman detail. Slug, urutan, featured/filter, gambar utama, email, dan kontak tetap sama; ringkasan Pasar Iwak/SICULI diperjelas.
- Template hanya menambah metadata Role. CSS dan interaksi frontend tidak diubah. Tidak ada API, database, migration, autentikasi, atau deployment yang ditambahkan.
- Build menolak section kosong, paragraf/metadata tidak valid, dan daftar tools/services yang tidak berbentuk array teks. Pengujian juga mempertahankan perilaku metadata kosong, escaping, serta URL yang aman.
- Tes browser membandingkan narasi, role, timeline, tools, caption, dan CTA pada semua detail dengan data sumber pada lebar 390 dan 1440px; pemeriksaan responsive Karind tetap berjalan pada enam viewport.

Hasil verifikasi setelah build:

| Pemeriksaan | Hasil |
|---|---|
| `npm run build` | Berhasil: homepage dan lima halaman detail |
| `npm run check` | Berhasil: sintaks JavaScript |
| `npm test` | 12/12 lulus |
| `npm run test:browser` | 31/31 lulus; tidak ada runtime exception atau permintaan aset lokal gagal dalam alur pengujian |
| Narasi dan metadata seluruh detail | Sesuai data sumber pada 390/1440px; tidak ada overflow horizontal |
| Pemeriksaan visual screenshot | Karind dan Matsuri Castle desktop/mobile: caption, tools, role, paragraf, related work, dan CTA tetap terbaca serta tidak bertumpuk |

Artefak render dan hasil tes browser tersedia di `docs/audit/`. Pengujian tidak mengirim email, melakukan login, atau mempublikasikan website. Keberhasilan tes lokal tidak menyatakan backend proyek eksternal telah diuji.
