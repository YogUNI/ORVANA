# 07. Panduan UI/UX

## 1. Prinsip

1. **Mobile-first** untuk peran lapangan (pemasok, koordinator, pengawas mutu) dan **desktop-first** untuk dapur, admin, dan auditor. Semua halaman harus bisa dipakai pada lebar 375 px.
2. **Satu tindakan utama per layar.** Tombol utama jelas, aksi destruktif memakai konfirmasi.
3. **Bahasa sederhana.** Pemasok mungkin tidak terbiasa dengan aplikasi: kalimat pendek, istilah sehari-hari, ikon + teks.
4. **Selalu tampilkan status dan langkah berikutnya.** Pengguna harus tahu "sekarang apa yang harus saya lakukan".
5. **Transparansi:** angka uang dan kuantitas selalu disertai satuan dan sumber (mis. "Harga acuan").
6. **Tidak mengandalkan warna saja** untuk makna (tambahkan ikon/teks).

## 2. Identitas visual

| Elemen | Pilihan |
|---|---|
| Karakter | Hangat, tepercaya, membumi (tema pangan lokal) |
| Warna utama | Hijau daun `#2F6B3F` (hover `#255534`, latar lembut `#E8F2EA`) |
| Aksen | Kuning padi `#D98E04` (latar lembut `#FDF3DC`) |
| Netral | `#1F2937` (teks), `#6B7280` (teks sekunder), `#E5E7EB` (garis), `#F9FAFB` (latar) |
| Status | Sukses `#15803D`, Peringatan `#B45309`, Bahaya `#B91C1C`, Info `#1D4ED8` |
| Font | `Plus Jakarta Sans` (judul) dan `Inter` (isi), fallback sistem |
| Sudut | Radius 8 px (kartu 12 px), bayangan halus |
| Ikon | `lucide-react` |
| Spasi | Skala 4 px (Tailwind default) |

Definisikan token pada `tailwind.config.ts` (`colors.brand`, `colors.accent`) agar tidak ada warna hardcode di komponen.

## 3. Layout

- **Desktop:** sidebar kiri (menu per peran) + header (judul halaman, lonceng notifikasi, menu akun) + konten maks lebar 1200 px.
- **Mobile:** header ringkas + **bottom navigation** 4 sampai 5 item untuk SUPPLIER, COORDINATOR, QUALITY_INSPECTOR; hamburger untuk peran lain.
- Komponen layout: `AppShell`, `PageHeader`, `Section`, `EmptyState`, `ErrorState`, `LoadingSkeleton`.

## 4. Peta halaman per peran

**Publik:** `/` (landing: masalah, cara kerja 4 langkah, angka dampak, kotak cari kode batch, tombol masuk/daftar), `/trace/:batchCode`, `/login`, `/register`.

**KITCHEN_MANAGER (`/kitchen`)**
- `/kitchen` Beranda: kartu "Kebutuhan minggu ini", "Permintaan terbuka", "Pengiriman menuju dapur", "Perlu tindakan".
- `/kitchen/menu` Kalender menu mingguan (tambah resep + porsi per hari).
- `/kitchen/demand` Daftar draf/terbit; tombol "Hitung kebutuhan"; aksi "Terbitkan".
- `/kitchen/demand/:id` Detail: kuantitas, sisa, tab Kandidat (skor + komponen), tab Order.
- `/kitchen/receiving` Barang dalam perjalanan + form penerimaan.
- `/kitchen/orders`, `/kitchen/payments`, `/kitchen/disputes`.

**SUPPLIER (`/supplier`) (mobile-first)**
- `/supplier` Beranda: "Tawaran baru" (hitung mundur), "Stok saya", "Pembayaran terakhir", skor mutu.
- `/supplier/orders` Kartu tawaran: komoditas, kuantitas, harga, dapur tujuan (nama), batas jawab; tombol **Terima** / **Tolak** (tolak membuka pilihan alasan).
- `/supplier/stock` Daftar + tombol "Tambah stok" (form: komoditas, kuantitas kg, tanggal panen, harga per kg; tampilkan harga acuan sebagai petunjuk).
- `/supplier/calendar` (P1) Heatmap komoditas × minggu dengan label Kurang/Cukup/Berlebih + saran.
- `/supplier/payments` Riwayat: Ditahan, Dibayar, Dibatalkan, dengan rincian per order.
- `/supplier/profile` Profil, lokasi (peta), opsi "Tampilkan nama usaha di halaman publik".

**COORDINATOR (`/coordinator`) (mobile-first)**
- `/coordinator/orders` Order siap kirim, dikelompokkan per dapur dan tanggal; pilih beberapa → "Buat pengiriman".
- `/coordinator/shipments` Daftar dengan stepper status (Direncanakan → Jemput → Dikirim → Tiba).
- `/coordinator/shipments/:id` Titik jemput berurut (peta kecil + daftar), tombol ubah status, form susut dan biaya angkut.

**QUALITY_INSPECTOR (`/inspector`) (mobile-first)**
- `/inspector/queue` Antrean batch menunggu QC (komoditas, kuantitas, dapur, waktu tiba).
- `/inspector/check/:batchId` Formulir: checklist per item (stepper 0 sampai 100 atau slider), skor total otomatis, jumlah diterima/ditolak, catatan, unggah foto; pratinjau hasil (Lolos/Sebagian/Ditolak) sebelum kirim.
- `/inspector/history`, `/inspector/standards`.

**ADMIN (`/admin`)**
- `/admin/dashboard` (kartu dampak, grafik, peta), `/admin/users` (verifikasi), `/admin/master/*`, `/admin/orders`, `/admin/ledger`, `/admin/disputes`, `/admin/settings`, `/admin/audit`.

**AUDITOR (`/auditor`)**
- `/auditor/dashboard` (indikator dampak + ledger ringkas), `/auditor/ledger`, `/auditor/trace` (cari batch).

## 5. Pola komponen

| Komponen | Pedoman |
|---|---|
| Tabel | Header lekat, urut/filter sederhana, paginasi; pada mobile ubah menjadi daftar kartu |
| Formulir | Label di atas input, pesan galat di bawah input (Indonesia), tombol utama di kanan bawah/penuh lebar di mobile; React Hook Form + Zod |
| Status badge | Lihat tabel di bawah; selalu ikon + teks |
| Hitung mundur | Teks "Sisa 3 jam 20 menit"; merah bila < 2 jam |
| Konfirmasi | Dialog untuk aksi yang tidak dapat dibatalkan (tolak order, ajukan sengketa, terbitkan QC) |
| Toast | Hasil aksi singkat; galat server ditampilkan dari `error.message` |
| Peta | `react-leaflet` + OpenStreetMap; pin pemasok (hijau), dapur (kuning); klik pin untuk ringkasan |
| Grafik | Recharts; selalu sertakan judul, satuan sumbu, dan tabel alternatif ringkas |
| Unggah foto | Tombol kamera/galeri, pratinjau, kompres sisi klien ke lebar maks 1280 px |
| Angka | `Intl.NumberFormat('id-ID')`; rupiah `Rp 1.250.000`; kuantitas `12,5 kg` |

### Badge status order

| Status | Label UI | Warna |
|---|---|---|
| PROPOSED | Menunggu jawaban | Info |
| ACCEPTED | Disanggupi | Sukses |
| REJECTED / EXPIRED | Ditolak / Kedaluwarsa | Netral |
| CONSOLIDATED | Siap dikirim | Info |
| IN_TRANSIT | Dalam perjalanan | Aksen |
| RECEIVED | Diterima, menunggu QC | Peringatan |
| QC_PASSED | Lolos mutu | Sukses |
| QC_PARTIAL | Lolos sebagian | Peringatan |
| QC_FAILED | Ditolak mutu | Bahaya |
| DISPUTED | Sengketa | Bahaya |
| PAID | Dibayar (tercatat) | Sukses |
| COMPLETED | Selesai | Netral |
| CANCELLED | Dibatalkan | Netral |

Simpan pemetaan ini di `frontend/src/lib/labels.ts` (satu sumber untuk label dan warna).

## 6. State wajib di setiap halaman data

- **Loading:** skeleton, bukan spinner kosong.
- **Kosong:** ilustrasi/ikon + penjelasan + tombol aksi (contoh: "Belum ada stok. Tambah stok pertama Anda").
- **Galat:** pesan ramah + tombol "Coba lagi"; 403 menampilkan "Anda tidak memiliki akses".
- **Sukses aksi:** toast + pembaruan data (invalidate query TanStack).

## 7. Salinan teks (nada dan contoh)

Nada: ramah, jelas, tidak menggurui, tidak berlebihan.

| Konteks | Contoh |
|---|---|
| Tawaran baru (pemasok) | "Dapur Gizi Demo A meminta 40 kg bayam untuk 12 Okt. Jawab sebelum 18.30." |
| Harga di bawah dasar | "Harga ini di bawah harga dasar petani (Rp 6.000/kg). Naikkan harga agar tetap adil." |
| Pasokan kurang | "Baru 29 dari 69 kg yang terpenuhi. Kami terus mencari pemasok lain." |
| QC ditolak sebagian | "4 kg tidak lolos mutu. Pembayaran dilepas untuk 25 kg." |
| Kosong | "Belum ada permintaan. Susun menu minggu ini untuk menghitung kebutuhan." |
| Tidak ada akses | "Halaman ini hanya untuk pengelola dapur." |

Hindari istilah teknis (mis. "payload", "transaksi gagal"). Gunakan "Terjadi kendala, coba lagi" bila penyebab tidak relevan bagi pengguna.

## 8. Aksesibilitas dan keterbacaan

- Kontras teks minimal 4,5:1; ukuran teks isi minimal 16 px di mobile.
- Target sentuh minimal 44 × 44 px.
- Semua input punya label; urutan tab logis; fokus terlihat.
- Gambar bermakna punya `alt`; ikon dekoratif `aria-hidden`.

## 9. Struktur kode frontend

```
frontend/src/
  app/ router.tsx, providers.tsx, layouts/ (PublicLayout, RoleLayout)
  pages/ public/ kitchen/ supplier/ coordinator/ inspector/ admin/ auditor/
  features/ auth/ demand/ supply/ orders/ shipments/ qc/ ledger/ dashboard/ notifications/
            (tiap folder: api.ts, hooks.ts, components/, schemas.ts)
  components/ui/  Button, Input, Select, Card, Badge, Modal, Table, Toast, Skeleton, EmptyState
  lib/ apiClient.ts (axios + interceptor refresh), format.ts, labels.ts, constants.ts, auth.ts
```

- Data server lewat TanStack Query (`useQuery`/`useMutation`), kunci kueri konsisten (`['orders', filters]`).
- Skema Zod berbagi bentuk dengan DTO backend; jangan menduplikasi aturan bisnis penting di frontend (hanya validasi bentuk; aturan bisnis diputuskan backend dan pesannya ditampilkan).
- Proteksi rute: `RequireAuth` dan `RequireRole(roles)`; pengalihan awal sesuai peran.
