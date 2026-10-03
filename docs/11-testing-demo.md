# 11. Pengujian dan Skenario Demo

## 1. Strategi uji

| Lapisan | Alat | Fokus |
|---|---|---|
| Unit (backend) | Jest | Fungsi murni: perencana kebutuhan, skor pencocokan, alokasi, hitung QC, ledger, penomoran, mesin transisi |
| Integrasi (backend) | Jest + Supertest + PostgreSQL uji (basis data terpisah, di-reset per berkas) | Endpoint, guard peran, scoping, transaksi, konkurensi |
| Komponen (frontend) | Vitest + Testing Library | Formulir (validasi), badge status, hitung mundur, pemformatan angka |
| E2E (opsional, P1) | Playwright | Skenario demo bagian 4 |
| Manual | Daftar periksa bagian 5 | Responsif, kegunaan, kasus tepi |

Aturan: logika bisnis wajib punya uji; target cakupan baris 80 persen untuk modul `matching`, `ledger`, `qc`, `demand`.
Gunakan `Decimal` pada uji uang dan kuantitas.

## 2. Uji unit wajib (ambil nilai dari `09-seed-data.md`)

| ID | Uji | Hasil yang diharapkan |
|---|---|---|
| U1 | `computeNeed` untuk R1 1000 porsi | Beras 81,6; Lele 77,0; Bayam 69,0; Bawang merah 10,8; Pisang 77,0 |
| U2 | `computeNeed` dibulatkan ke atas 0,1 | Cabai rawit 5,25 → 5,3 |
| U3 | `matchScore` S1/S2/S3 | 88,97 / 83,60 / 68,23 |
| U4 | Filter kandidat | S3 masuk kandidat (harga 9.000 ≤ 10.000); jika maks 8.500, S3 keluar |
| U5 | `allocate` | S1 40 kg, S2 29 kg, S3 tidak ada |
| U6 | Alokasi satu kandidat | Order 40 kg, sisa 29 kg, status permintaan `PARTIALLY_FULFILLED` |
| U7 | Tolak setelah alokasi | Reservasi turun; pemasok dikecualikan; alokasi ulang ke S2 dan S3 sesuai cap |
| U8 | Validasi harga dasar | 5.500 < 6.000 → `PRICE_BELOW_FLOOR` |
| U9 | `computeQcResult` | (diterima 40, ditolak 0, skor 90) → PASS; (29, 4, 72) → PARTIAL; (29, 29, 50) → FAIL; (40, 0, 60) → `SCORE_BELOW_PASS_REQUIRES_REJECTION` |
| U10 | Ledger PASS | RELEASE 320.000, invarian tercapai |
| U11 | Ledger PARTIAL | RELEASE 187.500, VOID 30.000 |
| U12 | Ledger ADJUSTMENT | +15.000 → RELEASE efektif 202.500, VOID efektif 15.000 |
| U13 | EMA mutu | 88 dan skor 90 → 88,40; 80 dan 72 → 78,40 |
| U14 | EMA keandalan | 0,95 dan tepat waktu → 0,96; 0,80 → 0,84 |
| U15 | Penomoran | Kode batch `ORV-YYYYMMDD-DPR01-0001`, bertambah per dapur per hari, unik saat dipanggil paralel |
| U16 | Mesin transisi | Semua transisi sah di `03` bagian 2 berhasil; contoh tidak sah (`PROPOSED` → `PAID`) → `INVALID_TRANSITION` |
| U17 | Label kalender panen | demand 100 dan supply 70 → "Kurang"; 100 dan 100 → "Cukup"; 100 dan 140 → "Berlebih" |
| U18 | Metrik dampak | Data historis `09` bagian 7 → Rp 5.730.000; 5 produsen; 84,29%; 15,71%; 66,67%; 16,29 km; +1,14%; 83,33% |

## 3. Uji integrasi dan keamanan wajib

| ID | Uji |
|---|---|
| I1 | Setiap endpoint menolak tanpa token (401) dan peran salah (403) |
| I2 | **IDOR:** pengelola Dapur B tidak dapat membaca/mengubah permintaan/order Dapur A; pemasok tidak dapat menjawab order pemasok lain |
| I3 | Akun `PENDING` ditolak (`ACCOUNT_NOT_ACTIVE`); `SUSPENDED` tidak bisa refresh |
| I4 | Dua pemasok menerima bersamaan pada stok terbatas: tidak ada stok negatif atau reservasi berlebih |
| I5 | Dua koordinator memilih order yang sama: hanya satu berhasil |
| I6 | QC dikirim dua kali: yang kedua `QC_ALREADY_SUBMITTED` |
| I7 | Transaksi QC atomik: jika penulisan ledger gagal, status order dan QC tidak berubah |
| I8 | Ledger: tidak ada rute update/delete; entri tidak berubah setelah dibuat |
| I9 | Halaman publik `/public/trace/:code` tidak memuat email/telepon/alamat/foto; nama tersamarkan bila `publicName = false` |
| I10 | Unggah: tipe/ukuran tidak sah ditolak; nama berkas diganti acak; berkas tidak dapat diakses tanpa izin sesuai aturan |
| I11 | Rate limit login menolak percobaan berlebih (429) |
| I12 | Respons tidak pernah memuat `passwordHash` atau token mentah lain |

## 4. Skenario demo (kurang lebih 5 menit)

Siapkan dengan `npm run seed:reset` (skenario `all`). Buka lima jendela/profil peramban berbeda atau gunakan jendela privat bergantian.
Akun dan kata sandi: `09-seed-data.md` bagian 2. Tanggal D = Senin depan.

**Persiapan sebelum tampil:** pada Dapur A sudah ada menu Senin (R1) dan stok bayam S1, S2, S3 (bagian 6 `09`), tetapi permintaan bayam **belum** dibuat (agar dapat didemokan dari awal).

| Menit | Peran | Langkah | Yang ditunjukkan |
|---|---|---|---|
| 0:00 | (slide/landing) | Tampilkan landing: masalah dalam 1 kalimat dan angka dampak | Konteks |
| 0:30 | Admin | Dashboard dampak (data historis) lalu halaman harga acuan | Harga dasar melindungi petani, data wilayah |
| 1:00 | Pengelola dapur A | Menu Senin 1000 porsi → "Hitung kebutuhan" → bayam 69 kg | Perencana kebutuhan |
| 1:30 | Pengelola dapur A | Ubah harga maks ke 10.000, tekan "Terbitkan"; tampilkan tab Kandidat dan skor | Pencocokan transparan (88,97 / 83,60 / 68,23) |
| 2:00 | Pemasok S1 dan S2 | Buka tawaran, tekan **Terima** | Kepastian pasar; HOLD tercatat |
| 2:30 | Koordinator | Pilih dua order → buat pengiriman → Jemput → Berangkat → Tiba | Konsolidasi dan batch |
| 3:15 | Pengelola dapur A | Catat penerimaan (40 dan 29 kg) | Penerimaan |
| 3:30 | Pengawas mutu | S1: lolos. S2: tolak 4 kg dengan catatan dan foto | Kontrol mutu bertingkat |
| 4:15 | Pemasok S2 / Admin | Lihat pembayaran: RELEASE 187.500 dan VOID 30.000 (opsional: ajukan sengketa lalu diputus) | Pembayaran bertahap transparan |
| 4:30 | Publik | Pindai/buka `/trace/<kode batch S1>` | Ketertelusuran |
| 4:45 | Auditor | Dashboard dan ledger ringkas | Akuntabilitas |
| 5:00 | Penutup | Kembali ke angka dampak, SDGs 2, 8, 12 | Dampak |

**Rencana cadangan:**
- Siapkan **rekaman layar** skenario di atas bila internet/laptop bermasalah.
- Siapkan **tangkapan layar** tiap langkah di slide.
- Siapkan **cadangan basis data** (`pg_dump`) dan perintah pemulihan; uji sebelum hari-H.
- Pastikan semua akun dapat login dan zona waktu sistem benar.

**Daftar periksa sebelum tampil:**
- [ ] `seed:reset` dijalankan dan skenario dilatih minimal 3 kali
- [ ] Koneksi dan baterai aman; resolusi layar diuji pada proyektor
- [ ] Semua jendela peran sudah login dan tersusun urut
- [ ] Data validasi lapangan (wawancara/pilot) siap ditunjukkan bila ada
- [ ] Naskah dan slide konsisten dengan angka di aplikasi

## 5. Daftar periksa QA manual

**Fungsi**
- [ ] Semua peran dapat login dan hanya melihat menu miliknya
- [ ] Alur P0 selesai dari menu sampai pembayaran tanpa galat
- [ ] Pesan galat bisnis tampil dalam bahasa Indonesia yang jelas
- [ ] Penolakan, kedaluwarsa, dan alokasi ulang berjalan
- [ ] Angka dashboard sesuai `09` bagian 7

**Tampilan**
- [ ] Lebar 375 px: tidak ada elemen terpotong atau gulir horizontal (kecuali tabel dalam wadah gulir)
- [ ] Loading, kosong, dan galat tampil di setiap halaman data
- [ ] Format `Rp`, `kg`, tanggal Indonesia konsisten
- [ ] Kontras dan ukuran sentuh memadai

**Keamanan**
- [ ] Mengubah ID pada URL ke milik orang lain menghasilkan 403/404
- [ ] Token kedaluwarsa memicu refresh; refresh dicabut setelah logout atau akun ditangguhkan
- [ ] Tidak ada rahasia di repo; `.env` ada di `.gitignore`

## 6. Pertanyaan yang kemungkinan diajukan juri dan arah jawabannya

(Jawaban adalah arah; sesuaikan dengan data nyata tim.)

| Pertanyaan | Arah jawaban |
|---|---|
| Apa bedanya dengan marketplace pertanian biasa? | Pencocokan **kebutuhan terjadwal** dengan **rencana panen**, bukan transaksi sewaktu-waktu; ditambah mutu bertingkat, penelusuran, dan ledger dalam satu alur |
| Mengapa petani mau memakai? | Kepastian permintaan sebelum tanam, harga dasar yang melindungi, pembayaran tercatat, input sederhana, pendampingan koordinator |
| Bagaimana menjamin mutu dan mencegah kecurangan? | Pemeriksaan oleh pengawas independen, skor reputasi, ledger append-only, log audit, penelusuran batch |
| Apakah ini mengurus uang sungguhan? | Tidak pada prototipe; ledger adalah pencatatan dan rekonsiliasi. Integrasi pembayaran adalah tahap berikutnya dengan mitra resmi |
| Bagaimana dampaknya diukur? | Metrik di dashboard (nilai belanja lokal, produsen terlibat, pemenuhan, penolakan, jarak) dan keterkaitan target SDGs |
| Bagaimana keberlanjutannya? | Opsi dukungan dinas, iuran layanan kecil dari dapur, atau kemitraan lembaga pendamping (sesuaikan hasil validasi) |
| Apa risiko dan keterbatasannya? | Ketergantungan pada mitra lapangan dan literasi digital; mitigasi: antarmuka sederhana, pendampingan, mode manual; AI sebagai tahap lanjutan dengan verifikasi manusia |
| Bagaimana privasi data? | Peran dan scoping data, penyamaran pada halaman publik, tanpa data pribadi di auditor |
| Sudah diuji ke pengguna nyata? | Jawab jujur sesuai kondisi: wawancara/pilot yang sudah dilakukan; bila belum, jelaskan rencana dan simulasi |
