# 10. Roadmap dan Daftar Tugas

Cara pakai: kerjakan **berurutan**, satu tugas per sesi. Setelah tugas selesai dan uji lulus, centang kotaknya dan commit.
Tanda `[A1]`, `[A2]`, `[A3]` menunjukkan usulan pemilik (lihat bagian 11); tugas `[All]` dikerjakan bergiliran atau bersama.
Estimasi dalam "sesi" (satu sesi kerja dengan agent, kira-kira 1 sampai 3 jam).

**Aturan tetap:** jangan lompat ke tahap berikutnya sebelum tahap sekarang lulus *gerbang tahap* (Gate).
Jangan mengerjakan P2 atau modul AI kecuali diminta.

---

## Tahap 0: Fondasi proyek (P0)

- [x] **T0.1** `[All]` Buat repo monorepo (`backend/`, `frontend/`, `docs/`), `.gitignore`, `.editorconfig`, `.env.example`, Prettier + ESLint. *(1 sesi)*
- [x] **T0.2** `[All]` `docker-compose.yml` dengan PostgreSQL 16 (volume, port 5432). *(0,5 sesi)*
- [x] **T0.3** `[A1]` Scaffold NestJS (TypeScript strict), konfigurasi env (`@nestjs/config`), Swagger di `/api/docs`, filter galat global dengan format `error`, interceptor respons `data/meta`, validasi global (`ValidationPipe`, whitelist). *(1 sesi)*
- [x] **T0.4** `[A3]` Pasang Prisma 6, salin skema dari `05-database-schema.md`, jalankan migrasi awal, `PrismaService`. *(1 sesi)*
- [x] **T0.5** `[A2]` Scaffold React + Vite + TS + Tailwind (token warna di `07`), React Router, TanStack Query, `apiClient`, `labels.ts`, komponen UI dasar (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Toast`, `Skeleton`, `EmptyState`). *(1,5 sesi)*

**Gate 0:** `docker compose up -d db`, backend dan frontend berjalan, Swagger terbuka, halaman placeholder tampil, migrasi terpasang.

## Tahap 1: Auth, peran, dan sistem dasar (P0)

- [x] **T1.1** `[A1]` Modul `auth`: register (3 peran + profil), login, refresh (rotasi), logout, `me`; bcrypt; JWT; rate limit login (M0). *(2 sesi)*
- [x] **T1.2** `[A1]` `RolesGuard`, decorator `@Roles`, `@CurrentUser`, helper `scopeWhere`, tolak akun `PENDING/SUSPENDED` (`ACCOUNT_NOT_ACTIVE`). *(1 sesi)*
- [x] **T1.3** `[A3]` `AuditService` + pemanggilan standar; `SettingsService` + `GET/PUT /settings` dengan validasi bobot; seed pengaturan default. *(1 sesi)*
- [x] **T1.4** `[A1]` Modul `users` untuk admin: daftar, buat (ADMIN/INSPECTOR/AUDITOR), ubah status (naikkan `tokenVersion`). *(1 sesi)*
- [x] **T1.5** `[A2]` Frontend: halaman `/login`, `/register` (pilih peran, form profil, pin peta), `/pending`, `RequireAuth/RequireRole`, `RoleLayout` (sidebar desktop, bottom nav mobile), pengalihan sesuai peran, `/admin/users`. *(2 sesi)*
- [x] **T1.6** `[A3]` Skrip seed dasar: wilayah, akun demo, dapur, pemasok, koordinator (`09` bagian 1 sampai 4). *(1 sesi)*

**Gate 1:** login tiap peran menuju dashboard kosong yang benar; peran lain tidak bisa membuka rute yang bukan haknya (UI dan API); admin dapat mengaktifkan akun PENDING.

## Tahap 2: Data master, menu, dan permintaan (P0)

- [x] **T2.1** `[A3]` Backend master: commodities, quality standard, recipes + items, price references (validasi floor ≤ ref ≤ ceiling), regions (M1). *(2 sesi)*
- [x] **T2.2** `[A3]` Seed komoditas, harga acuan, standar mutu, resep (`09` bagian 5). *(1 sesi)*
- [x] **T2.3** `[A2]` Frontend admin master: komoditas, resep, harga acuan, pengaturan; standar mutu untuk inspektur. *(2 sesi)*
- [x] **T2.4** `[A1]` Backend menu + `DemandPlanner` (rumus `04` bagian 2) + endpoint generate, dengan **uji unit memakai tabel `09` bagian 5.4**. *(2 sesi)*
- [x] **T2.5** `[A1]` Backend demand: CRUD, publish (validasi `PRICE_BELOW_FLOOR`, tanggal), cancel (M2). *(1,5 sesi)*
- [x] **T2.6** `[A2]` Frontend dapur: `/kitchen/menu`, `/kitchen/demand`, `/kitchen/demand/:id` (tanpa tab kandidat dulu). *(2,5 sesi)*

**Gate 2:** menu Senin 1000 porsi R1 menghasilkan draf sesuai tabel; harga di bawah dasar ditolak dengan pesan jelas; draf tidak duplikat. *(LOLOS)*

## Tahap 3: Pasokan, pencocokan, dan order (P0)

- [x] **T3.1** `[A2]` Backend supply offers (validasi harga dasar, tidak turun di bawah reserved) (M3). *(1,5 sesi)*
- [x] **T3.2** `[A2]` Frontend `/supplier/stock` (daftar + form + petunjuk harga acuan). *(1,5 sesi)*
- [x] **T3.3** `[A1]` `MatchingService`: filter kandidat, fungsi skor murni, alokasi greedy dengan cap, transaksi dan penguncian, **uji unit memakai vektor `09` bagian 6** (skor 88,97 / 83,60 / 68,23; alokasi 40 dan 29). *(3 sesi)*
- [x] **T3.4** `[A1]` Order: endpoint list/detail, accept (HOLD ledger via `LedgerService`), reject (alokasi ulang), cancel; mesin transisi `OrdersService.transition` (`03` bagian 2). *(2,5 sesi)*
- [x] **T3.5** `[A3]` `LedgerService.record()` dengan pemeriksaan invarian + uji unit (`04` bagian 7). *(1,5 sesi)*
- [x] **T3.6** `[A1]` Tugas terjadwal: kedaluwarsa tawaran + alokasi ulang (idempoten). *(1 sesi)*
- [x] **T3.7** `[A2]` Frontend `/supplier/orders` (kartu tawaran + hitung mundur + terima/tolak) dan tab Kandidat/Order di `/kitchen/demand/:id`. *(2,5 sesi)*

**Gate 3:** skenario bayam `09` bagian 6 berjalan dari UI: dua order terbentuk dengan skor dan kuantitas yang benar, pemasok menerima, HOLD tercatat; tolak dan kedaluwarsa memicu alokasi ulang; uji konkurensi lulus. *(LOLOS)*

## Tahap 4: Logistik (P0)

- [x] **T4.1** `[A2]` Backend shipments: available-for-shipment, create (validasi satu dapur), status machine, pembuatan Batch + kode saat `IN_TRANSIT`, `ARRIVED` dengan susut dan pembaruan keandalan (M5). *(3 sesi)*
- [x] **T4.2** `[A2]` Frontend `/coordinator/orders`, `/coordinator/shipments`, `/coordinator/shipments/:id` (stepper). *(2,5 sesi)*

**Gate 4:** dua order disanggupi dapat digabung dalam satu pengiriman, melewati status sampai tiba; kode batch sesuai format; order dari dapur berbeda ditolak. *(LOLOS)*

## Tahap 5: Penerimaan, mutu, dan pembayaran (P0)

- [x] **T5.1** `[A3]` Upload (multer, validasi tipe/ukuran, folder terproteksi). *(1 sesi)*
- [x] **T5.2** `[A3]` Backend receive + QC: skor dari checklist, hasil PASS/PARTIAL/FAIL, efek ledger, pembaruan skor pemasok, satu QC final, semuanya dalam satu transaksi + **uji dengan vektor `09` bagian 6** (RELEASE 320.000; 187.500 + VOID 30.000; mutu 88,40 dan 78,40). *(3 sesi)*
- [x] **T5.3** `[A3]` Frontend `/kitchen/receiving`, `/inspector/queue`, `/inspector/check/:batchId` (pratinjau hasil), `/inspector/history`. *(3 sesi)*
- [x] **T5.4** `[A3]` Frontend pembayaran: `/supplier/payments`, `/kitchen/payments`, `/admin/ledger`; `GET /ledger`, `/ledger/summary`. *(2 sesi)*
- [x] **T5.5** `[A1]` Tugas terjadwal penyelesaian order (`PAID/QC_FAILED` → `COMPLETED` setelah jendela). *(0,5 sesi)*

**Gate 5:** skenario bayam selesai sampai pembayaran tercatat sesuai angka vektor uji; invarian ledger terjaga; QC ganda ditolak. *(LOLOS)*

## Tahap 6: Transparansi dan dashboard (P0)

- [x] **T6.1** `[A3]` `GET /public/trace/:batchCode` + halaman `/trace/:batchCode` (linimasa, penyamaran privasi) (M9). *(2 sesi)*
- [x] **T6.2** `[A3]` Query metrik dampak (`04` bagian 10) + `GET /dashboard/impact` + uji terhadap tabel `09` bagian 7. *(2,5 sesi)*
- [x] **T6.3** `[A3]` Seed skenario historis (`09` bagian 7). *(1 sesi)*
- [x] **T6.4** `[A2]` Frontend `/admin/dashboard` dan `/auditor/dashboard` (kartu, grafik Recharts, peta Leaflet), `/auditor/ledger`. *(3 sesi)*
- [x] **T6.5** `[A2]` Landing publik `/` (masalah, cara kerja, angka dampak dari `/public/impact-summary`, pencarian batch). *(1,5 sesi)*

**Gate 6 (MVP P0 lengkap):** seluruh skenario demo (`11` bagian 4) dapat dijalankan dari awal sampai akhir tanpa intervensi basis data manual; angka dashboard sama dengan `09` bagian 7. *(LOLOS)*

## Tahap 7: Fitur P1

- [x] **T7.1** `[A1]` Sengketa (M8) + efek ADJUSTMENT + UI. *(3 sesi)*
- [x] **T7.2** `[A2]` Rencana panen dan kalender kolektif (M3) + UI heatmap. *(3 sesi)*
- [x] **T7.3** `[A2]` Notifikasi dalam aplikasi (M11) + polling + UI lonceng. *(2 sesi)*
- [x] **T7.4** `[A3]` QR batch dan sertifikat PDF (M9). *(2 sesi)*
- [x] **T7.5** `[A3]` Tampilan audit log (M12) dan ekspor CSV order (M10). *(1,5 sesi)*
- [x] **T7.6** `[A1]` Dashboard per peran (kitchen, supplier, coordinator). *(2 sesi)*
- [x] **T7.7** `[A1]` Ulasan pemasok oleh dapur. *(1 sesi)*

**Gate 7 (Fitur P1 lengkap):** seluruh fitur P1 (sengketa, rencana panen, notifikasi, QR batch, sertifikat PDF, audit log, CSV export, role dashboard, dan ulasan pemasok) selesai, teruji 100%, dan terintegrasi di UI. *(LOLOS)*

## Tahap 8: Penyempurnaan dan persiapan lomba

### 8A. Perbaikan logika hasil review Tahap 7 (dikerjakan pertama)

- [x] **T8.0a** Sertifikat PDF publik wajib menyamarkan nama pemasok bila `publicName = false` dan tidak mengambil `phone` (`02` bagian 6). Tambah uji.
- [x] **T8.0b** Ekspor CSV: samakan rute dengan `06` M10 (`GET /reports/orders.csv`) dan unduh lewat `apiClient` (blob + Bearer token), bukan `window.open`.
- [x] **T8.0c** Ulasan pemasok: hapus update `SupplierProfile` yang tidak berefek; rating hanya dicatat dan ditampilkan (rata-rata di dasbor pemasok). Tidak memengaruhi `qualityScore` karena `04` tidak mendefinisikan rumusnya.
- [x] **T8.0d** Daftarkan endpoint baru di `06` (QR/PDF publik per `batchCode`, `POST /orders/:id/reviews`).
- [x] **T8.0e** Periksa nilai bawaan dasbor per peran terhadap `04`/`05` (mis. `qualityScore` default) dan state kosong saat profil belum ada.

### 8B. Peningkatan UI semua halaman (per peran, satu commit per peran)

Acuan: `07-ui-ux-guidelines.md`, tema Artisan Agritech, lebar 375 px, kontras dan fokus keyboard.

- [x] **T8.U0** Komponen dasar bersama: `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, tabel yang berubah menjadi kartu di mobile. Pindahkan query halaman ke hook `features/`.
- [x] **T8.U1** Publik: landing (hero, cara kerja, angka dampak, cari batch), `/trace/:batchCode`, login, register, pending.
- [x] **T8.U2** Dapur: dasbor, menu, kebutuhan, detail kebutuhan, penerimaan, pembayaran.
- [x] **T8.U3** Pemasok: dasbor, stok, rencana panen, kalender kolektif, pesanan, pembayaran.
- [ ] **T8.U4** Koordinator: dasbor, konsolidasi, pengiriman, detail pengiriman.
- [ ] **T8.U5** Pengawas mutu: antrean, form QC, standar mutu.
- [ ] **T8.U6** Admin: dasbor, pengguna, master data, pengaturan, sengketa, ledger, audit, laporan.
- [ ] **T8.U7** Auditor dan notifikasi.

Setiap tugas U selesai bila: build frontend dan `npm test` hijau, state loading/kosong/error ada, tampilan dicek di 375 px.

### 8C. Persiapan lomba

- [ ] **T8.1** `[All]` Uji responsif 375 px untuk semua halaman peran lapangan; perbaiki.
- [ ] **T8.2** `[All]` Audit state kosong/loading/galat di setiap halaman data.
- [ ] **T8.3** `[All]` Latihan skenario demo 3 kali dengan `seed:reset` di antaranya; catat dan perbaiki hambatan.
- [ ] **T8.4** `[All]` Uji keamanan dasar: akses lintas peran, IDOR (membuka `/orders/:id` milik orang lain), unggah berkas berbahaya, rate limit.
- [ ] **T8.5** `[All]` Perbarui dokumen Word (naskah dan perancangan) agar cocok dengan hasil akhir; kumpulkan tangkapan layar untuk naskah lomba.
- [ ] **T8.6** `[All]` Siapkan data validasi lapangan (wawancara, pilot) bila mitra tersedia.
- [ ] **T8.7** `[All]` Dockerisasi penuh (`docker compose up` menjalankan db + backend + frontend) dan README cara jalan.

## Tahap 9: Modul AI (DITUNDA, hanya jika diminta)

- [ ] **T9.1** NLP input stok berbasis aturan (`08` bagian 3), uji dengan kasus 3.6.
- [ ] **T9.2** UI "tulis stok dengan kalimat" + konfirmasi.
- [ ] **T9.3** (opsional) foto mutu / OCR sesuai `08`.

---

## 11. Usulan pembagian tugas tiga anggota

| Anggota | Fokus | Tahap utama |
|---|---|---|
| A1 | Permintaan, pencocokan, order, auth | T0.3, T1.1 sampai T1.4, T2.4, T2.5, T3.3, T3.4, T3.6, T5.5, T7.1, T7.6, T7.7 |
| A2 | Pasokan, logistik, frontend umum | T0.5, T1.5, T2.3, T2.6, T3.1, T3.2, T3.7, T4.1, T4.2, T6.4, T6.5, T7.2, T7.3 |
| A3 | Mutu, ledger, transparansi, data | T0.4, T1.3, T1.6, T2.1, T2.2, T3.5, T5.1 sampai T5.4, T6.1 sampai T6.3, T7.4, T7.5 |

Hindari konflik: tiap anggota bekerja di cabang sendiri (`feat/<tugas>`), gabung ke `main` lewat PR kecil; jangan dua orang mengubah `schema.prisma` bersamaan (koordinasi di grup sebelum membuat migrasi).

## 12. Contoh perintah ke agent (salin dan sesuaikan)

**Memulai tugas:**
> Baca `AGENTS.md`, `docs/04-business-rules.md` bagian 4, dan `docs/09-seed-data.md` bagian 6. Kita mengerjakan tugas **T3.3 (MatchingService)**. Buat rencana singkat (file yang akan dibuat/diubah, fungsi murni yang akan diuji, risiko) dan tunggu persetujuan saya sebelum menulis kode.

**Saat implementasi:**
> Implementasikan sesuai rencana. Tulis dulu uji unit untuk fungsi skor dan alokasi memakai vektor uji di `09` bagian 6, lalu kodenya. Jalankan `npm test` dan tunjukkan hasilnya. Jangan mengubah file di luar modul `matching` kecuali perlu; jika perlu, jelaskan alasannya.

**Menutup tugas:**
> Periksa kriteria penerimaan modul terkait di `docs/06-feature-specs.md` dan DoD di `AGENTS.md`. Centang tugas di `docs/10-roadmap-tasks.md` hanya jika semuanya terpenuhi, dan perbarui dokumen yang berubah.

**Saat agent menyimpang:**
> Berhenti. Kamu mengubah aturan yang ada di `docs/04`. Kembalikan perubahan itu dan ikuti dokumen. Jika menurutmu aturan perlu diubah, ajukan usulan dulu beserta alasannya.
