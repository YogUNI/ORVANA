# 06. Spesifikasi Fitur per Modul

Prioritas: **P0** = wajib untuk demo; **P1** = penting, kerjakan setelah P0 stabil; **P2** = bonus; **Ditunda** = jangan dikerjakan kecuali diminta.
Notasi kriteria penerimaan: *Given / When / Then* (G/W/T).

## 0. Konvensi API (berlaku untuk semua modul)

- Base path `/api/v1`. Auth: header `Authorization: Bearer <accessToken>`. Dokumentasi otomatis via Swagger di `/api/docs`.
- Sukses: `{ "data": <objek|array>, "meta": { "page", "limit", "total" } }` (meta hanya untuk daftar).
- Gagal: `{ "error": { "code": "STRING_KODE", "message": "Pesan untuk pengguna (Indonesia)", "details": <opsional> } }`.
- Kode status: 200/201 sukses, 400 validasi, 401 belum login, 403 dilarang, 404 tidak ada, 409 konflik (mis. status tidak valid), 422 aturan bisnis dilanggar.
- Kode galat bisnis baku: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_TRANSITION`, `PRICE_BELOW_FLOOR`,
  `INSUFFICIENT_STOCK`, `ORDER_ALREADY_CONSOLIDATED`, `QC_ALREADY_SUBMITTED`, `SCORE_BELOW_PASS_REQUIRES_REJECTION`, `ACCOUNT_NOT_ACTIVE`.
- Daftar mendukung `?page=&limit=&sort=&order=` dan filter spesifik modul. `limit` maksimum 100.
- Pada setiap daftar, terapkan **scoping** sesuai `02-roles-permissions.md` bagian 5.
- Setiap endpoint yang mengubah data penting menulis `AuditLog`.

---

## M0. Autentikasi dan pengguna (P0)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `POST /auth/register` | publik | Peran terbatas: KITCHEN_MANAGER, SUPPLIER, COORDINATOR; membuat user PENDING + profil |
| `POST /auth/login` | publik | Mengembalikan access token, refresh token, ringkasan user |
| `POST /auth/refresh` | publik (refresh token) | Rotasi refresh token |
| `POST /auth/logout` | login | Mencabut refresh token |
| `GET /auth/me` | login | Profil + profil peran + jumlah notifikasi belum dibaca |
| `GET /users` | ADMIN | Filter `role`, `status`, `q` |
| `POST /users` | ADMIN | Membuat ADMIN, QUALITY_INSPECTOR, AUDITOR |
| `PATCH /users/:id/status` | ADMIN | `ACTIVE` atau `SUSPENDED`; menaikkan `tokenVersion` bila SUSPENDED |

**Halaman:** `/login`, `/register` (pilih peran + isi profil + pin lokasi pada peta), `/pending`, `/admin/users`.

**Kriteria penerimaan**
- G: email sudah terdaftar, W: register, T: 409 dengan pesan "Email sudah digunakan".
- G: user PENDING, W: akses endpoint peran, T: 403 `ACCOUNT_NOT_ACTIVE`.
- G: admin menangguhkan user, W: user memakai refresh token lama, T: 401.
- G: password kurang dari 8 karakter atau tanpa angka, W: register, T: 400 dengan pesan jelas.
- Password di-hash bcrypt (cost 10 atau lebih). `passwordHash` tidak pernah muncul di respons.
- Login gagal 5 kali berturut-turut dalam 10 menit dari IP yang sama → 429 (rate limit, `@nestjs/throttler`).

---

## M1. Data master (P0)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET /regions` | login | Daftar wilayah |
| `GET/POST/PATCH /commodities` | GET: login; tulis: ADMIN | Komoditas (kg), masa simpan, persen susut |
| `GET/PUT /commodities/:id/quality-standard` | GET: login; PUT: ADMIN, QUALITY_INSPECTOR | passScore + checklist (bobot = 100) |
| `GET/POST/PATCH/DELETE /recipes`, `/recipes/:id/items` | GET: login; tulis: ADMIN, KITCHEN_MANAGER | Resep dan bahan per porsi (kg) |
| `GET/POST /price-references` | GET: login; POST: ADMIN | Harga acuan; entri baru menutup `validTo` entri lama |
| `GET/PUT /settings` | ADMIN | Pengaturan sistem (lihat `04` bagian 0) |

**Halaman:** `/admin/master/commodities`, `/admin/master/recipes`, `/admin/master/prices`, `/admin/settings`, `/inspector/standards`.

**Kriteria penerimaan**
- G: `floorPrice > referencePrice`, W: simpan harga acuan, T: 400 (urutan harus floor ≤ reference ≤ ceiling).
- G: bobot checklist berjumlah ≠ 100, W: simpan standar, T: 400.
- G: bobot pencocokan berjumlah ≠ 1.0, W: simpan pengaturan, T: 400.
- Perubahan pengaturan menulis AuditLog `SETTING_UPDATED` dengan nilai lama dan baru.

---

## M2. Menu dan permintaan (P0)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET/POST /kitchens/:id/menu-plans` | KITCHEN_MANAGER (milik), ADMIN L | Daftar menurut rentang tanggal; buat menu (resep, tanggal, porsi) |
| `PATCH/DELETE /menu-plans/:id` | KITCHEN_MANAGER | Hanya bila belum ada permintaan OPEN untuk tanggal itu |
| `POST /kitchens/:id/demand/generate` | KITCHEN_MANAGER | Body `{from, to}`; menghitung kebutuhan (`04` bagian 2) dan membuat/memperbarui draf `DemandRequest` |
| `GET /demand-requests` | scoped | Filter `status`, `from`, `to`, `commodityId` |
| `GET /demand-requests/:id` | scoped | Termasuk daftar order dan sisa kuantitas |
| `PATCH /demand-requests/:id` | KITCHEN_MANAGER | Ubah kuantitas, harga maks, batas mutu selagi `DRAFT` (atau `OPEN` tanpa order) |
| `POST /demand-requests/:id/publish` | KITCHEN_MANAGER | `DRAFT` → `OPEN`, memicu pencocokan |
| `POST /demand-requests/:id/cancel` | KITCHEN_MANAGER, ADMIN | Lihat kasus tepi di `03` bagian 8 |

**Halaman:** `/kitchen/menu` (kalender mingguan), `/kitchen/demand` (tabel draf/terbit dengan aksi), `/kitchen/demand/:id` (detail + order).

**Kriteria penerimaan**
- G: menu Senin 1000 porsi resep R1, W: generate, T: draf sesuai vektor uji `09-seed-data.md` bagian 5.4.
- G: harga maks di bawah harga dasar, W: publish, T: 422 `PRICE_BELOW_FLOOR` dengan pesan harga dasar.
- G: `neededDate` hari ini atau lalu, W: publish, T: 422.
- G: generate dijalankan dua kali, T: tidak ada draf ganda untuk (dapur, komoditas, tanggal).
- Pengelola dapur tidak dapat melihat/mengubah permintaan dapur lain (403/404).

---

## M3. Pasokan: stok dan rencana panen (P0 stok; P1 kalender)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET/POST /supply-offers` | SUPPLIER (milik) | Buat stok: komoditas, kuantitas, tanggal panen, harga ajuan |
| `PATCH/DELETE /supply-offers/:id` | SUPPLIER | Tidak boleh menurunkan `quantityAvailable` di bawah `quantityReserved`; DELETE = status `CANCELLED` bila ada reservasi 0 |
| `GET /supply-offers/available` | KITCHEN_MANAGER, ADMIN | Stok aktif di wilayahnya (untuk pratinjau) |
| `GET/POST/PATCH/DELETE /harvest-plans` | SUPPLIER | Rencana panen (P1) |
| `GET /harvest-calendar?regionId=&weeks=4` | SUPPLIER, ADMIN, KITCHEN_MANAGER | Agregat per komoditas per minggu: demand, supply, ratio, label (P1) |

**Halaman:** `/supplier/stock` (daftar + form), `/supplier/harvest-plan` (P1), `/supplier/calendar` (P1: heatmap komoditas × minggu dengan label Kurang/Cukup/Berlebih).

**Kriteria penerimaan**
- G: harga ajuan di bawah harga dasar, W: simpan stok, T: 422 dengan pesan "Harga ajuan tidak boleh di bawah harga dasar (Rp X)".
- G: `harvestDate` lebih dari 14 hari dari hari ini, W: simpan, T: diperbolehkan tetapi ditandai rencana (gunakan HarvestPlan; arahkan pengguna).
- G: stok punya 40 kg tereservasi, W: ubah kuantitas ke 30, T: 422 `INSUFFICIENT_STOCK`.
- Kalender: G: demand 100 kg dan supply 70 kg minggu itu, T: label "Kurang" (ratio 0,7 < 0,8).

---

## M4. Pencocokan dan order (P0)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET /demand-requests/:id/candidates` | KITCHEN_MANAGER, ADMIN | Pratinjau kandidat + komponen skor (tidak membuat order) |
| `POST /demand-requests/:id/match` | KITCHEN_MANAGER, ADMIN | Menjalankan alokasi untuk sisa kuantitas (idempoten terhadap sisa) |
| `GET /orders` | scoped | Filter `status`, `demandId`, `from`, `to` |
| `GET /orders/:id` | scoped | Detail + riwayat transisi (dari AuditLog) |
| `POST /orders/:id/accept` | SUPPLIER (milik) | Hanya `PROPOSED` dan sebelum `offerExpiresAt`; membuat HOLD |
| `POST /orders/:id/reject` | SUPPLIER (milik) | Body `{reason}` wajib; memicu alokasi ulang |
| `POST /orders/:id/cancel` | ADMIN | Lepas reservasi, void HOLD, notifikasi |
| `POST /orders/:id/reviews` | KITCHEN_MANAGER, ADMIN | Rating 1-5 dan ulasan performa pemasok untuk pesanan selesai/dibayar (P1) |

**Halaman:** `/supplier/orders` (kartu tawaran dengan hitung mundur batas waktu, tombol Terima/Tolak), `/kitchen/demand/:id` (tab Kandidat dan Order), `/admin/orders`.

**Kriteria penerimaan**
- G: vektor uji di `09-seed-data.md` bagian 6, W: publish permintaan bayam 69 kg, T: dua order (S1 40 kg @ 8.000, S2 29 kg @ 7.500) dengan skor 88,97 dan 83,60; S3 tidak mendapat order.
- G: tidak ada kandidat, T: permintaan tetap `OPEN`, notifikasi dikirim.
- G: pemasok menolak order, T: reservasi dilepas, pemasok dikecualikan, alokasi ulang menawarkan sisa ke kandidat berikutnya.
- G: `offerExpiresAt` terlewati, T: tugas terjadwal mengubah menjadi `EXPIRED` dan mengalokasikan ulang.
- G: dua pemasok menerima bersamaan, T: tidak ada stok negatif (uji konkurensi).
- Accept: HOLD sebesar `ROUND(qty * price)` tercatat pada transaksi yang sama dengan perubahan status.
- Pemasok tidak dapat menjawab order milik pemasok lain (403).

---

## M5. Konsolidasi dan pengiriman (P0 dasar; P1 pelacakan rinci)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET /orders/available-for-shipment` | COORDINATOR | Order `ACCEPTED` di wilayahnya, dikelompokkan per dapur dan tanggal butuh |
| `POST /shipments` | COORDINATOR | Body `{kitchenId, orderIds[], scheduledAt, transportCost?, routeNotes?}`; semua order harus untuk dapur yang sama |
| `GET /shipments`, `GET /shipments/:id` | scoped | Termasuk daftar order dan titik jemput (dari profil pemasok) |
| `PATCH /shipments/:id/status` | COORDINATOR | `PICKING_UP`, `IN_TRANSIT` (membuat Batch + kode), `ARRIVED` (`lossKg`, `lossReason`), `CANCELLED` |

**Halaman:** `/coordinator/orders` (pilih order, buat pengiriman), `/coordinator/shipments` (tiap pengiriman punya stepper status), `/coordinator/shipments/:id`.

**Kriteria penerimaan**
- G: order dari dua dapur berbeda dipilih, T: 422.
- G: order sudah `CONSOLIDATED`, T: 409 `ORDER_ALREADY_CONSOLIDATED`.
- G: status → `IN_TRANSIT`, T: setiap order mendapat Batch dengan kode sesuai format, order menjadi `IN_TRANSIT`.
- G: status → `ARRIVED` setelah batas hari butuh, T: `reliabilityRate` pemasok turun (lihat `04` bagian 6.4).
- Loncat status (mis. `PLANNED` → `ARRIVED`) ditolak `INVALID_TRANSITION`.

---

## M6. Penerimaan dan kontrol mutu (P0)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `POST /uploads` | login | Multipart (jpeg/png/webp, maks 5 MB), mengembalikan `{url}` |
| `POST /orders/:id/receive` | KITCHEN_MANAGER | Body `{receivedQuantity, note?, photoUrls?}`; order `IN_TRANSIT` → `RECEIVED`; menandai selisih bila di luar toleransi |
| `GET /quality-queue` | QUALITY_INSPECTOR, ADMIN | Batch berstatus `RECEIVED` tanpa QC |
| `GET /batches/:id` | scoped | Detail batch + QC |
| `POST /batches/:id/quality-checks` | QUALITY_INSPECTOR, ADMIN | Body `{checklistScores, acceptedQuantity, rejectedQuantity, notes?, photoUrls?}`; skor dihitung server |

**Halaman:** `/kitchen/receiving` (daftar order dalam perjalanan, form penerimaan), `/inspector/queue`, `/inspector/check/:batchId` (formulir checklist dengan slider/angka, jumlah diterima/ditolak, foto), `/inspector/history`.

**Kriteria penerimaan** (satu transaksi untuk seluruh efek)
- G: skor 85, ditolak 0, W: submit, T: `PASS`, order `QC_PASSED` lalu `PAID`, ledger RELEASE penuh, skor pemasok diperbarui.
- G: diterima 29, ditolak 4, W: submit, T: `PARTIAL`, RELEASE `accepted*price` dan VOID sisa (lihat vektor uji `09` bagian 6).
- G: diterima 29, ditolak 29, T: `FAIL`, VOID seluruh HOLD.
- G: ditolak > 0 tanpa catatan ≥ 10 karakter, T: 400.
- G: skor 60 (di bawah 70) dan ditolak 0, T: 422 `SCORE_BELOW_PASS_REQUIRES_REJECTION`.
- G: QC kedua untuk batch yang sama, T: 409 `QC_ALREADY_SUBMITTED`.
- G: `accepted + rejected ≠ received`, T: 400.
- Dapur menerima notifikasi hasil QC; pemasok menerima notifikasi hasil + umpan balik.

---

## M7. Ledger dan pembayaran (P0)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET /ledger?orderId=&from=&to=` | DAPUR/PEMASOK (terkait), ADMIN | Entri berurutan waktu |
| `GET /ledger/summary?from=&to=` | ADMIN, AUDITOR | Total HOLD, RELEASE, VOID, tertahan; per pemasok (identitas disamarkan untuk auditor) |
| `GET /ledger/verify` | ADMIN, AUDITOR | (P2) Verifikasi rantai hash |
| (internal) `LedgerService.record()` | sistem | Satu-satunya pintu penulisan; memeriksa invarian |

**Halaman:** `/supplier/payments` (riwayat per order dengan status Ditahan/Dibayar/Dibatalkan), `/kitchen/payments`, `/admin/ledger`, `/auditor/ledger`.

**Kriteria penerimaan**
- G: order ACCEPTED, T: tepat satu entri HOLD.
- G: invarian `HOLD = RELEASE + VOID` dilanggar oleh kode, T: transaksi gagal (uji unit).
- Tidak ada endpoint PATCH/DELETE untuk ledger.
- Auditor tidak melihat email/telepon/alamat pemasok pada data ledger.

---

## M8. Sengketa (P1)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `POST /orders/:id/disputes` | KITCHEN_MANAGER, SUPPLIER (terkait) | Body `{reason, evidenceUrls?}`; dalam jendela 48 jam setelah QC |
| `GET /disputes`, `GET /disputes/:id` | pihak terkait, ADMIN | |
| `PATCH /disputes/:id/review` | ADMIN | `OPEN` → `UNDER_REVIEW` |
| `PATCH /disputes/:id/resolve` | ADMIN | Body `{outcome, adjustedAcceptedQuantity?, resolutionNote}`; menulis ADJUSTMENT bila perlu |

**Halaman:** tombol "Ajukan sengketa" pada detail order, `/admin/disputes`.

**Kriteria penerimaan**
- G: jendela 48 jam lewat, W: ajukan, T: 422.
- G: sengketa terbuka, T: order tidak menjadi `COMPLETED` oleh tugas terjadwal.
- G: putusan SPLIT dengan `adjustedAcceptedQuantity` 27 dari diterima 29 pada harga 7.500, T: ledger disesuaikan sehingga RELEASE total = `27 * 7.500` = 202.500 dan invarian terjaga.

---

## M9. Penelusuran batch dan sertifikat (P0 halaman publik; P1 QR dan PDF)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET /public/trace/:batchCode` | publik | Data teranonimkan (lihat `02` bagian 6) |
| `GET /public/trace/:batchCode/qr.png` | publik | Gambar QR code batch publik (P1) |
| `GET /public/trace/:batchCode/certificate.pdf` | publik | Unduh sertifikat PDF batch teranonimkan publik (P1) |
| `GET /batches/:id/certificate.pdf` | scoped | Sertifikat batch internal (P1) |
| `GET /batches/:id/qr.png` | scoped | QR menuju `${FRONTEND_URL}/trace/:batchCode` (P1) |
| `GET /public/impact-summary` | publik | Angka dampak teragregasi untuk landing |

**Halaman:** `/trace/:batchCode` (linimasa: panen → kirim → terima → hasil mutu → status pembayaran umum), pencarian kode di landing.

**Kriteria penerimaan**
- G: kode batch tidak ada, T: halaman "Batch tidak ditemukan" (404 ramah).
- G: halaman publik, T: tidak memuat email, telepon, alamat persis, atau foto bukti.
- G: `publicName = false`, T: nama pemasok tersamarkan.

---

## M10. Dashboard dan laporan (P0 admin dasar; P1 lainnya)

**Endpoint**

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET /dashboard/impact?from=&to=&regionId=` | ADMIN, AUDITOR | Metrik `04` bagian 10 + deret waktu mingguan |
| `GET /dashboard/kitchen` | KITCHEN_MANAGER | Kebutuhan vs terpenuhi, biaya, order aktif |
| `GET /dashboard/supplier` | SUPPLIER | Pendapatan tercatat, skor mutu, order aktif, kalender ringkas |
| `GET /dashboard/coordinator` | COORDINATOR | Order siap kirim, pengiriman aktif |
| `GET /reports/orders.csv?from=&to=` | ADMIN | Ekspor CSV (P1) |

**Halaman:** `/admin/dashboard` (kartu angka + grafik garis nilai belanja lokal mingguan + grafik batang tingkat pemenuhan per komoditas + peta pemasok dan dapur), `/auditor/dashboard`, dasbor ringkas per peran.

**Kriteria penerimaan**
- Angka dashboard cocok dengan perhitungan manual pada data seed skenario siap demo (`09` bagian 7).
- Periode kosong menampilkan state kosong yang informatif, bukan error.

---

## M11. Notifikasi dalam aplikasi (P1)

| Method dan path | Peran | Keterangan |
|---|---|---|
| `GET /notifications?unread=true` | login | Daftar dan jumlah belum dibaca |
| `PATCH /notifications/:id/read` | pemilik | |
| `POST /notifications/read-all` | pemilik | |

UI: ikon lonceng di header dengan badge, dropdown 10 terbaru, halaman `/notifications`. Polling tiap 30 detik (tanpa WebSocket pada MVP).
Peristiwa dan penerima: `04` bagian 12.

---

## M12. Audit log (P0 penulisan; P1 tampilan)

- Penulisan: interceptor atau pemanggilan eksplisit pada aksi di `AGENTS.md` aturan 7. Simpan `userId`, `action`, `entity`, `entityId`, `meta` (nilai lama/baru ringkas), `ipAddress`.
- `GET /audit-logs?entity=&entityId=&userId=&from=&to=` (ADMIN). Halaman `/admin/audit` dengan filter dan tabel.
- Jangan menyimpan kata sandi, token, atau data sensitif dalam `meta`.

---

## M13. Modul AI (Ditunda)

NLP input stok, penilaian mutu dari foto, OCR nota, dan prediksi pasokan **tidak dikerjakan** pada fase awal.
Kolom pencadang sudah ada (`SupplyOffer.sourceText`, `QualityCheck.aiSuggestedScore`). Rancangan lengkap: `08-ai-modules.md`.

---

## Ringkasan prioritas

| Modul | P0 | P1 | P2 / Ditunda |
|---|---|---|---|
| M0 Auth dan pengguna | semua | - | - |
| M1 Data master | komoditas, resep, harga acuan, standar mutu, pengaturan | - | - |
| M2 Menu dan permintaan | semua | - | - |
| M3 Pasokan | stok | rencana panen, kalender | - |
| M4 Pencocokan dan order | semua | - | - |
| M5 Pengiriman | buat, status, batch | catatan susut rinci | optimasi rute |
| M6 Penerimaan dan QC | semua | foto | skor AI |
| M7 Ledger | semua | - | hash berantai |
| M8 Sengketa | - | semua | - |
| M9 Penelusuran | halaman publik | QR, PDF | - |
| M10 Dashboard | admin dasar | per peran, CSV | - |
| M11 Notifikasi | - | semua | email/WA |
| M12 Audit | penulisan | tampilan | - |
| M13 AI | - | - | Ditunda |
