# 09. Data Demo (Seed) dan Vektor Uji

Semua data bersifat **ilustratif**: harga bukan data pasar, nama usaha fiktif, koordinat contoh. Ganti dengan data mitra nyata bila sudah ada.
Seed harus **idempoten** (`upsert`) dan dijalankan lewat `npm run seed:demo`; `npm run seed:reset` mengosongkan data lalu mengisi ulang.

Notasi tanggal: **D** = "Senin depan" relatif terhadap hari seed dijalankan (selalu hari Senin di masa depan, minimal H+1).
Zona waktu `Asia/Jakarta`.

## 1. Wilayah

| Nama | Provinsi |
|---|---|
| Kabupaten Demo | Jawa Barat |

## 2. Akun demo (hanya untuk pengembangan)

Kata sandi semua akun: `Demo1234!`. **Jangan dipakai di lingkungan produksi.**

| Peran | Nama | Email |
|---|---|---|
| ADMIN | Admin Dinas Demo | `admin@orvana.test` |
| KITCHEN_MANAGER | Pengelola Dapur A | `dapur-a@orvana.test` |
| KITCHEN_MANAGER | Pengelola Dapur B | `dapur-b@orvana.test` |
| SUPPLIER | Tani Makmur (S1) | `s1@orvana.test` |
| SUPPLIER | Kelompok Tani Sari (S2) | `s2@orvana.test` |
| SUPPLIER | Tani Jaya (S3) | `s3@orvana.test` |
| SUPPLIER | Gapoktan Harapan (S4) | `s4@orvana.test` |
| SUPPLIER | Mina Lestari (S5) | `s5@orvana.test` |
| SUPPLIER | Peternak Ayam Berkah (S6) | `s6@orvana.test` |
| SUPPLIER | UMKM Tempe Bu Rina (S7) | `s7@orvana.test` |
| SUPPLIER | Kelompok Tani Subur (S8) | `s8@orvana.test` |
| COORDINATOR | Koperasi Lumbung Desa | `koordinator1@orvana.test` |
| COORDINATOR | Pengepul Bersama | `koordinator2@orvana.test` |
| QUALITY_INSPECTOR | Pengawas Mutu Demo | `mutu@orvana.test` |
| AUDITOR | Auditor Publik Demo | `auditor@orvana.test` |

Semua berstatus `ACTIVE` dan berada di Kabupaten Demo.

## 3. Dapur

| Kode | Nama | Porsi | Lat, Lng | Pengelola |
|---|---|---|---|---|
| DPR01 | Dapur Gizi Demo A | 1000 | -6.6000, 106.8000 | `dapur-a` |
| DPR02 | Dapur Gizi Demo B | 600 | -6.6400, 106.8500 | `dapur-b` |

## 4. Pemasok

Jarak ke Dapur A dihitung haversine dari koordinat (toleransi ±0,01 km dari nilai target).

| ID | Nama usaha | Tipe | Desa | Lat, Lng | Jarak ke A (km) | Mutu | Keandalan | Total order | Komoditas |
|---|---|---|---|---|---|---|---|---|---|
| S1 | Tani Makmur | FARMER | Sukamaju | -6.5460, 106.8000 | 6,0 | 88 | 0,95 | 10 | bayam, kangkung |
| S2 | Kelompok Tani Sari | FARMER | Mekarsari | -6.5370, 106.9098 | 14,0 | 80 | 0,80 | 8 | bayam, wortel |
| S3 | Tani Jaya | FARMER | Jayagiri | -6.4561, 106.5491 | 32,0 | 92 | 0,90 | 12 | bayam, tomat |
| S4 | Gapoktan Harapan | FARMER | Harapan | -6.6935, 106.8543 | 12,0 | 85 | 0,90 | 9 | kangkung, tomat, cabai rawit, bawang merah |
| S5 | Mina Lestari | FISHER | Cibening | -6.6000, 106.9811 | 20,0 | 84 | 0,88 | 7 | ikan lele, ikan nila |
| S6 | Peternak Ayam Berkah | LIVESTOCK | Karangsari | -6.8113, 106.7226 | 25,0 | 78 | 0,85 | 6 | telur ayam, ayam potong |
| S7 | UMKM Tempe Bu Rina | PROCESSOR | Pasirmulya | -6.6450, 106.7216 | 10,0 | 90 | 0,92 | 6 | tempe |
| S8 | Kelompok Tani Subur | FARMER | Subur | -6.4598, 106.7185 | 18,0 | 82 | 0,85 | 5 | beras, pisang |

`publicName = true` untuk S1, S4, S7; `false` untuk lainnya (untuk menguji penyamaran).

Koordinator: titik kumpul "Titik Kumpul Sukamaju" (-6.5700, 106.8100) dan "Titik Kumpul Mekarsari" (-6.5500, 106.8900).

## 5. Komoditas, harga acuan, dan resep

### 5.1 Komoditas (semua satuan kg)

| Komoditas | Kategori | Masa simpan (hari) | Susut (%) | Dasar | Acuan | Batas atas |
|---|---|---|---|---|---|---|
| Bayam | VEGETABLE | 3 | 15 | 6.000 | 8.000 | 12.000 |
| Kangkung | VEGETABLE | 3 | 15 | 5.000 | 7.000 | 10.000 |
| Wortel | VEGETABLE | 10 | 8 | 9.000 | 12.000 | 16.000 |
| Tomat | VEGETABLE | 6 | 10 | 10.000 | 14.000 | 20.000 |
| Cabai rawit | SPICE | 5 | 5 | 30.000 | 45.000 | 80.000 |
| Bawang merah | SPICE | 21 | 8 | 28.000 | 35.000 | 55.000 |
| Telur ayam | POULTRY_EGG | 14 | 3 | 24.000 | 28.000 | 34.000 |
| Ikan lele | FISH | 2 | 10 | 26.000 | 30.000 | 38.000 |
| Ikan nila | FISH | 2 | 10 | 28.000 | 33.000 | 42.000 |
| Ayam potong | POULTRY_EGG | 2 | 5 | 32.000 | 38.000 | 46.000 |
| Tempe | PROTEIN_PROCESSED | 2 | 3 | 18.000 | 22.000 | 28.000 |
| Beras | STAPLE | 180 | 2 | 12.000 | 14.000 | 17.000 |
| Pisang | FRUIT | 5 | 10 | 13.000 | 18.000 | 24.000 |

Harga berlaku `validFrom` = awal tahun berjalan, wilayah Kabupaten Demo. `passScore` semua komoditas 70.
Checklist standar (jumlah bobot 100): Kesegaran 40, Kondisi fisik/cacat 25, Keseragaman ukuran 15, Kebersihan 10, Penanganan/suhu 10.

### 5.2 Resep (kg per porsi)

| Resep | Bahan (kg/porsi) |
|---|---|
| **R1** Nasi, Lele Goreng, Tumis Bayam, Pisang | Beras 0,08; Ikan lele 0,07; Bayam 0,06; Bawang merah 0,01; Pisang 0,07 |
| **R2** Nasi, Telur Balado, Sup Wortel | Beras 0,08; Telur ayam 0,06; Wortel 0,05; Tomat 0,02; Cabai rawit 0,005; Bawang merah 0,01 |
| **R3** Nasi, Ayam Goreng, Capcay Kangkung | Beras 0,08; Ayam potong 0,07; Kangkung 0,06; Wortel 0,03; Bawang merah 0,01; Pisang 0,07 |
| **R4** Nasi, Tempe Orek, Telur Rebus, Sayur Bening | Beras 0,08; Tempe 0,05; Telur ayam 0,06; Bayam 0,05; Wortel 0,02 |
| **R5** Nasi, Nila Bakar, Lalap Tomat Kangkung | Beras 0,08; Ikan nila 0,08; Kangkung 0,04; Tomat 0,04; Cabai rawit 0,005; Pisang 0,07 |

### 5.3 Menu mingguan Dapur A (1000 porsi/hari)

Senin = R1, Selasa = R2, Rabu = R3, Kamis = R4, Jumat = R5 (minggu yang dimulai pada D).

### 5.4 Vektor uji: kebutuhan bahan (1000 porsi, `needQty = porsi × kg/porsi × (1 + susut)`, dibulatkan ke atas 0,1)

| Hari | Komoditas | Hitungan | Hasil (kg) |
|---|---|---|---|
| Senin (R1) | Beras | 80 × 1,02 | 81,6 |
| | Ikan lele | 70 × 1,10 | 77,0 |
| | Bayam | 60 × 1,15 | 69,0 |
| | Bawang merah | 10 × 1,08 | 10,8 |
| | Pisang | 70 × 1,10 | 77,0 |
| Selasa (R2) | Beras | 80 × 1,02 | 81,6 |
| | Telur ayam | 60 × 1,03 | 61,8 |
| | Wortel | 50 × 1,08 | 54,0 |
| | Tomat | 20 × 1,10 | 22,0 |
| | Cabai rawit | 5 × 1,05 = 5,25 → naik ke 0,1 | 5,3 |
| | Bawang merah | 10 × 1,08 | 10,8 |
| Rabu (R3) | Beras | 80 × 1,02 | 81,6 |
| | Ayam potong | 70 × 1,05 | 73,5 |
| | Kangkung | 60 × 1,15 | 69,0 |
| | Wortel | 30 × 1,08 | 32,4 |
| | Bawang merah | 10 × 1,08 | 10,8 |
| | Pisang | 70 × 1,10 | 77,0 |
| Kamis (R4) | Beras | 80 × 1,02 | 81,6 |
| | Tempe | 50 × 1,03 | 51,5 |
| | Telur ayam | 60 × 1,03 | 61,8 |
| | Bayam | 50 × 1,15 | 57,5 |
| | Wortel | 20 × 1,08 | 21,6 |
| Jumat (R5) | Beras | 80 × 1,02 | 81,6 |
| | Ikan nila | 80 × 1,10 | 88,0 |
| | Kangkung | 40 × 1,15 | 46,0 |
| | Tomat | 40 × 1,10 | 44,0 |
| | Cabai rawit | 5 × 1,05 = 5,25 → 5,3 | 5,3 |
| | Pisang | 70 × 1,10 | 77,0 |

Gunakan aritmetika `Decimal`; uji harus membandingkan string/Decimal, bukan float.

## 6. Vektor uji: pencocokan, QC, ledger (skenario bayam Senin D)

**Masukan:** permintaan Dapur A, Bayam **69,0 kg**, `neededDate = D`, `maxPricePerUnit = 10.000` (diubah dari default 8.000; di bawah batas atas 12.000), `minQualityScore = 60`.
Pengaturan default (`04` bagian 0). Harga acuan bayam 8.000, masa simpan 3 hari.

**Stok bayam yang tersedia:**

| Pemasok | Stok (kg) | Tanggal panen | Harga ajuan | Jarak (km) | Mutu | Keandalan | Umur (hari) |
|---|---|---|---|---|---|---|---|
| S1 | 40 | D − 1 | 8.000 | 6 | 88 | 0,95 | 1 |
| S2 | 50 | D | 7.500 | 14 | 80 | 0,80 | 0 |
| S3 | 60 | D − 2 | 9.000 | 32 | 92 | 0,90 | 2 |

**Skor (uji unit memakai jarak yang diberikan; uji integrasi dengan koordinat seed menerima toleransi ±0,05):**

| Pemasok | sJarak | sMutu | sHarga | sKesegaran | sKeandalan | Skor |
|---|---|---|---|---|---|---|
| S1 | 0,88 | 0,88 | 1,000 | 0,6667 | 0,95 | **88,97** |
| S2 | 0,72 | 0,80 | 1,000 | 1,0000 | 0,80 | **83,60** |
| S3 | 0,36 | 0,92 | 0,875 | 0,3333 | 0,90 | **68,23** |

Perhitungan S3: sHarga = 1 − (9.000 − 8.000)/8.000 = 0,875.

**Alokasi:** batas per pemasok = 69 × 0,6 = 41,4 kg.
- S1: min(69; 40; 41,4) = **40 kg** @ 8.000 → 320.000 (sisa 29)
- S2: min(29; 50; 41,4) = **29 kg** @ 7.500 → 217.500 (sisa 0)
- S3: tidak mendapat order.

**Ledger setelah keduanya menerima:** HOLD 320.000 (S1) dan HOLD 217.500 (S2).

**Pengiriman dan QC (kedua tiba pada hari D):**
- S1: diterima 40, diterima QC 40, ditolak 0, skor 90 → `PASS` → RELEASE 320.000. Mutu baru = 0,8 × 88 + 0,2 × 90 = **88,40**. Keandalan baru = 0,8 × 0,95 + 0,2 × 1 = **0,96**.
- S2: diterima 29, diterima QC 25, ditolak 4, skor 72 → `PARTIAL` → RELEASE 187.500 dan VOID 30.000. Mutu baru = 0,8 × 80 + 0,2 × 72 = **78,40**. Keandalan baru = 0,8 × 0,80 + 0,2 × 1 = **0,84**.

**Sengketa (S2 mengajukan, admin memutus SPLIT dengan `adjustedAcceptedQuantity` = 27):**
RELEASE efektif = 27 × 7.500 = **202.500**; ADJUSTMENT **+15.000**; VOID efektif **15.000**. Invarian: 202.500 + 15.000 = 217.500 = HOLD.

**Vektor tambahan:**
- Permintaan bayam 69 kg dengan `maxPricePerUnit` = 5.500 → `PRICE_BELOW_FLOOR` (dasar 6.000).
- Satu-satunya kandidat S1 dengan stok 40 kg untuk permintaan 69 kg → order 40 kg (cap 41,4 tidak membatasi), permintaan `PARTIALLY_FULFILLED` dengan sisa 29 kg.
- S1 menolak order → reservasi dilepas, S1 dikecualikan; alokasi ulang menawarkan 29 kg ke S2 (dan sisa ke S3 sesuai cap).
- Order QC dengan `rejected = 0`, skor 60 → `SCORE_BELOW_PASS_REQUIRES_REJECTION`.

## 7. Skenario siap demo (data historis untuk dashboard)

Dua minggu sebelum D, Dapur A memiliki 6 order selesai (status `COMPLETED`), semua pemasok di wilayah yang sama dengan dapur.
Permintaan setiap order = kuantitas order; diterima = dikirim.

| Order | Pemasok | Komoditas | Kuantitas | Harga | Acuan | Diterima QC | Ditolak | Hasil | RELEASE | VOID | Tepat waktu |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H1 | S1 | Bayam | 50 | 8.000 | 8.000 | 50 | 0 | PASS | 400.000 | 0 | ya |
| H2 | S5 | Ikan lele | 70 | 31.000 | 30.000 | 70 | 0 | PASS | 2.170.000 | 0 | ya |
| H3 | S6 | Telur ayam | 60 | 28.000 | 28.000 | 55 | 5 | PARTIAL | 1.540.000 | 140.000 | tidak |
| H4 | S2 | Wortel | 40 | 12.500 | 12.000 | 40 | 0 | PASS | 500.000 | 0 | ya |
| H5 | S7 | Tempe | 50 | 22.000 | 22.000 | 0 | 50 | FAIL | 0 | 1.100.000 | ya |
| H6 | S8 | Beras | 80 | 14.000 | 14.000 | 80 | 0 | PASS | 1.120.000 | 0 | ya |

**Nilai yang harus ditampilkan dashboard untuk periode yang mencakup keenam order:**

| Metrik | Perhitungan | Nilai |
|---|---|---|
| Nilai belanja lokal | 400.000 + 2.170.000 + 1.540.000 + 500.000 + 0 + 1.120.000 | **Rp 5.730.000** |
| Produsen terlibat | S1, S5, S6, S2, S8 (S7 RELEASE 0 tidak dihitung) | **5** |
| Tingkat pemenuhan | 295 / 350 | **84,29%** |
| Tingkat penolakan | 55 / 350 | **15,71%** |
| Tingkat lolos mutu | 4 PASS dari 6 batch | **66,67%** |
| Jarak tempuh rata-rata (tertimbang kuantitas) | (50×6 + 70×20 + 60×25 + 40×14 + 50×10 + 80×18) / 350 = 5.700 / 350 | **16,29 km** |
| Premi harga vs acuan | (70 × 1.000/30.000 + 40 × 500/12.000) / 350 = 4,0 / 350 | **+1,14%** |
| Ketepatan waktu | 5 dari 6 | **83,33%** |
| Nilai tertahan | semua tuntas | **Rp 0** |

Ditambah satu pengiriman aktif untuk skenario langsung demo (opsional): lihat `11-testing-demo.md` bagian 4.

## 8. Pengaturan sistem (seed)

Isi `SystemSetting` dengan seluruh kunci dan nilai default di `04-business-rules.md` bagian 0.

## 9. Persyaratan skrip seed

- Idempoten: menjalankan dua kali tidak menggandakan data (gunakan `upsert` dengan kunci alami: `email`, `code`, `name`, kombinasi unik).
- Tanggal relatif terhadap hari eksekusi (D dan "dua minggu lalu"), bukan nilai tetap.
- Hash kata sandi dengan bcrypt saat seed.
- Menulis `LedgerEntry` historis melalui `LedgerService` agar invarian terjaga (atau memeriksanya setelah seed).
- Pada akhir seed, cetak ringkasan: jumlah per entitas dan akun demo.
- Mode `--scenario=base` (master + akun + stok untuk vektor uji), `--scenario=history` (data historis bagian 7), `--scenario=all` (default).
