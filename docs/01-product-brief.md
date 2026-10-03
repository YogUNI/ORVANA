# 01. Product Brief

## 1. Ringkasan

**Nama proyek: ORVANA** (sebelumnya nama kerja "Lumbung Lokal"). Penjelasan makna nama dan tagline resmi dapat dilengkapi tim; sampai saat itu gunakan deskripsi: *platform rantai pasok pangan lokal untuk dapur gizi massal*.

ORVANA adalah platform web yang mempertemukan **kebutuhan terjadwal** dapur gizi massal dengan **rencana panen** petani, nelayan,
dan UMKM pangan lokal. Berbeda dari marketplace biasa, sistem ini merencanakan permintaan lebih dulu (dari menu dan porsi),
mencocokkannya dengan pasokan, memeriksa mutu saat barang tiba, membayar bertahap, dan menyimpan jejak asal bahan.

## 2. Masalah

1. Dapur skala besar butuh pasokan rutin, bermutu, dan terstandar, tetapi produsen kecil di sekitarnya tidak tahu kebutuhan itu.
2. Petani/nelayan sering terjebak rantai panjang dan tengkulak: harga tidak stabil, panen serentak menekan harga, pembayaran tidak transparan.
3. Asal bahan sulit ditelusuri sehingga masalah mutu lambat ditangani.
4. Aliran dana dan manfaat ekonomi bagi produsen lokal sulit diaudit.

## 3. Solusi

| Kemampuan | Penjelasan singkat |
|---|---|
| Perencana kebutuhan | Menu + porsi + resep standar menghasilkan kebutuhan bahan per tanggal |
| Pencocokan pasokan | Memasangkan kebutuhan dengan stok pemasok (jarak, mutu, harga, kesegaran, keandalan) |
| Kalender panen kolektif | Petani melihat permintaan agregat agar rencana tanam/panen tersebar |
| Konsolidasi dan pengiriman | Koordinator menggabungkan pasokan kecil menjadi satu pengiriman per dapur |
| Kontrol mutu bertingkat | Penerimaan, pemeriksaan checklist, hasil lolos/sebagian/ditolak, skor reputasi pemasok |
| Pembayaran bertahap | Buku catatan: tahan (hold) saat order disanggupi, lepas (release) setelah lolos mutu |
| Penelusuran batch | Kode batch + QR menuju halaman publik asal, mutu, dan tanggal |
| Dashboard dampak | Nilai belanja lokal, jumlah produsen, tingkat pemenuhan, tingkat penolakan, jarak tempuh |

## 3a. Nilai pembeda (untuk pitch juri)

- Mencocokkan **kebutuhan terjadwal** dengan **rencana panen**, bukan transaksi sewaktu-waktu.
- Pasokan menjadi dapat diprediksi, dan inilah kepastian yang selama ini tidak dimiliki produsen kecil.
- Ketertelusuran, mutu, dan pembayaran dalam satu alur yang saling menguatkan.
- Harga acuan dengan **harga dasar** melindungi produsen (sistem menolak permintaan di bawah harga dasar).

## 4. Pengguna

| Peran | Tujuan |
|---|---|
| Pengelola dapur | Pasokan rutin, bermutu, asal jelas, biaya terkendali |
| Petani/nelayan | Kepastian pasar, harga adil, pembayaran tercatat |
| Koordinator/pengepul | Pengumpulan dan pengiriman efisien |
| Pengawas mutu/ahli gizi | Menjamin keamanan dan mutu bahan |
| Admin dinas/pembina | Wilayah tertib, harga acuan, putusan sengketa, data untuk kebijakan |
| Auditor publik | Mengawasi aliran dana dan asal bahan |

## 5. Tujuan MVP

Prototipe web yang menjalankan **satu skenario inti dari awal sampai akhir**:
satu dapur, 3 sampai 5 pemasok, 1 koordinator, 1 pengawas mutu, 1 admin, dan 1 auditor.

Alur wajib (P0): menu dan porsi → kebutuhan → permintaan → pencocokan → order → terima/tolak pemasok → konsolidasi dan kirim →
terima dan QC → pembayaran (ledger) → jejak batch publik → dashboard dasar.

## 6. Non-goals (JANGAN dibangun di MVP)

- Pembayaran uang sungguhan, integrasi bank/payment gateway (ledger hanya **pencatatan**).
- Aplikasi mobile native; cukup web responsif.
- Optimasi rute kompleks (routing/VRP). Cukup urutan titik manual.
- Multi-bahasa. UI hanya Bahasa Indonesia.
- Satuan selain kg. Semua komoditas MVP memakai kg.
- Modul AI (NLP, foto mutu, OCR). Ditunda; lihat `08-ai-modules.md`.
- Chat real-time, notifikasi email/WhatsApp (cukup notifikasi dalam aplikasi, P1).

## 7. Istilah (glossary)

| Istilah | Arti |
|---|---|
| Dapur | Dapur gizi massal yang melayani sejumlah porsi per hari |
| Pemasok (supplier) | Petani, nelayan/pembudidaya ikan, peternak, atau UMKM pengolah |
| Permintaan (demand request) | Kebutuhan satu komoditas pada satu tanggal dari satu dapur |
| Stok/tawaran (supply offer) | Stok yang tersedia dari pemasok pada tanggal panen tertentu |
| Rencana panen (harvest plan) | Perkiraan panen di masa depan, dipakai untuk kalender kolektif |
| Order | Penugasan sebagian atau seluruh permintaan kepada satu pemasok |
| Pengiriman (shipment) | Gabungan beberapa order ke satu dapur pada satu jadwal |
| Batch | Unit penelusuran satu order yang dikirim, memiliki kode unik |
| QC | Pemeriksaan mutu (quality check) |
| Ledger | Buku catatan pembayaran (hold, release, void, adjustment) |
| Harga acuan | Harga referensi per komoditas per wilayah: dasar (floor), acuan (reference), batas atas (ceiling) |
| Skor mutu pemasok | Nilai 0 sampai 100 yang diperbarui dari hasil QC |
| Keandalan (reliability) | Tingkat ketepatan waktu dan penyelesaian order pemasok (0 sampai 1) |

## 8. Keterkaitan SDGs

Utama: **SDG 2** (2.1 pangan aman dan bergizi, 2.3 produktivitas dan pendapatan produsen kecil),
**SDG 8** (8.3 dukungan usaha mikro kecil), **SDG 12** (12.3 pengurangan kehilangan pangan sepanjang rantai pasok).
Pendukung: **SDG 3** dan **SDG 17** (17.17 kemitraan). Metrik dampak ada di `04-business-rules.md` bagian 10.
Catatan: cocokkan rumusan target dengan teks resmi sebelum dikutip di naskah.

## 9. Asumsi dan hal yang belum pasti

- Kriteria penilaian lomba PHKM belum diverifikasi oleh tim; sesuaikan penekanan setelah juknis diterima.
- Keberadaan mitra lapangan (dapur, kelompok tani) belum dipastikan; demo memakai data simulasi (`09-seed-data.md`).
- Harga pada data demo bersifat ilustratif, bukan data pasar.

## 10. Ukuran keberhasilan prototipe

| Aspek | Ukuran |
|---|---|
| Kesesuaian pasokan | % kebutuhan dapur terpenuhi pemasok lokal pada simulasi |
| Mutu | % batch yang lolos QC |
| Transparansi | Setiap batch memiliki jejak lengkap (asal, mutu, ledger) |
| Dampak lokal | Nilai belanja ke pemasok lokal pada simulasi |
| Kemudahan | Pemasok menyelesaikan "terima order" dalam kurang dari 3 klik dari notifikasi/dashboard |
