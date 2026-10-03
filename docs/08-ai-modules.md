# 08. Modul AI (DITUNDA)

> **Status: ditunda.** Jangan membangun modul di dokumen ini pada fase awal. Alur inti (P0) harus stabil lebih dulu.
> Tim akan menyesuaikan lagi kapan dan modul mana yang dikerjakan. Dokumen ini hanya menjaga agar desain inti tetap siap menerimanya.

## 1. Prinsip

1. **Manusia selalu memutuskan.** Keluaran AI adalah saran; pengguna mengonfirmasi atau mengoreksi.
2. **Tanpa AI, sistem tetap lengkap.** Setiap fitur AI punya jalur manual yang setara.
3. **Layanan terpisah.** AI berjalan sebagai layanan Python (FastAPI) kecil yang dipanggil backend NestJS lewat HTTP internal; frontend tidak memanggil AI langsung.
4. **Tidak melatih dari nol.** Pakai aturan, model siap pakai, atau transfer learning ringan.
5. **Lapor jujur.** Ukur dan laporkan akurasi pada data uji tim sendiri.
6. **Privasi.** Jangan mengirim data pribadi ke layanan eksternal; hanya teks/gambar yang diperlukan.

## 2. Titik penyambungan yang sudah disiapkan

| Titik | Kolom/endpoint | Perilaku saat AI mati |
|---|---|---|
| Input stok bahasa natural | `SupplyOffer.sourceText`, `POST /supply-offers/parse-text` | Formulir manual (sudah ada di M3) |
| Penilaian mutu foto | `QualityCheck.aiSuggestedScore`, `POST /ai/quality-score` | Pengawas mengisi checklist manual (M6) |
| Baca nota (OCR) | `POST /ai/ocr-receipt` | Input angka manual |
| Prediksi pasokan (opsional) | `GET /forecast/supply` | Kalender panen memakai rencana yang diinput |

Konfigurasi: `AI_SERVICE_URL` (kosong = fitur AI dimatikan). Backend memeriksa `GET /ai/health` dan menyembunyikan UI AI bila tidak sehat.

## 3. Modul A: NLP input stok (kandidat pertama)

### 3.1 Tujuan
Pemasok mengetik satu kalimat, mis. "besok panen 200 kg cabai rawit, harga 45 ribu", dan sistem mengubahnya menjadi isian formulir stok yang **harus dikonfirmasi** pemasok.

### 3.2 Kontrak

`POST /api/v1/supply-offers/parse-text` (SUPPLIER)

```json
// request
{ "text": "besok panen 200 kg cabai rawit harga 45 ribu" }

// response
{ "data": {
  "candidates": [
    {
      "commodityId": "uuid",
      "commodityName": "Cabai rawit",
      "quantityKg": 200,
      "harvestDate": "2026-10-13",
      "askingPrice": 45000,
      "confidence": 0.92,
      "missing": []
    }
  ],
  "warnings": ["Harga di atas harga acuan"]
} }
```

- `missing` berisi nama kolom yang tidak ditemukan (mis. `["harvestDate"]`); UI menyorot isian itu.
- Dapat mengembalikan lebih dari satu kandidat bila kalimat memuat beberapa komoditas.
- Backend memvalidasi hasil dengan aturan M3 sebelum menyimpan; **tidak ada penyimpanan otomatis**.

### 3.3 Pendekatan bertahap

1. **Tahap 1, berbasis aturan (disarankan dulu):** kamus sinonim komoditas, regex jumlah dan satuan, parser tanggal relatif, parser harga. Cepat, deterministik, mudah diuji.
2. **Tahap 2, opsional:** model bahasa untuk kalimat yang tidak tertangani aturan, dengan keluaran dibatasi skema JSON dan divalidasi sebelum dipakai.

### 3.4 Aturan penguraian

| Aspek | Aturan |
|---|---|
| Jumlah dan satuan | `kg`, `kilo`, `kilogram` = ×1; `kwintal`/`kw` = ×100; `ton` = ×1000; `ons` = ×0,1; `gram` = ÷1000; bahasa campur seperti "2 kwintal" didukung |
| Tanggal relatif | `hari ini`, `besok`, `lusa`, `minggu depan`, `senin depan`, `tgl 15`, `15 oktober`; basis tanggal = hari ini di `Asia/Jakarta`; `minggu depan` dan `senin depan` = Senin pekan berikutnya; `tgl N` = tanggal N bulan berjalan (atau bulan depan bila sudah lewat) |
| Harga | "45 ribu", "45rb", "45.000", "45000", "Rp45.000/kg"; ambigu tanpa satuan dianggap per kg |
| Komoditas | Cocokkan nama dan sinonim; toleransi salah ketik ringan (jarak edit ≤ 1 untuk kata ≥ 5 huruf) |
| Tidak jelas | Jangan menebak; kembalikan `missing` dan turunkan `confidence` |

### 3.5 Kamus sinonim awal (perluas bersama pemasok)

| Komoditas | Sinonim |
|---|---|
| Cabai rawit | cabe rawit, cabai, cabe, lombok rawit |
| Bawang merah | bawang, brambang |
| Bayam | bayem |
| Kangkung | kangkong |
| Ikan lele | lele |
| Ikan nila | nila, nilem |
| Telur ayam | telor, telur |
| Ayam potong | ayam, broiler |
| Tempe | tempeh |
| Tomat | tomat merah |
| Wortel | karot |
| Pisang | gedang |
| Beras | beras putih |

### 3.6 Kasus uji (tanggal: hari ini = Senin 12 Okt 2026)

| Masukan | Keluaran yang diharapkan |
|---|---|
| "besok panen 200 kg cabai rawit harga 45 ribu" | Cabai rawit, 200 kg, 2026-10-13, 45.000 |
| "lusa ada bayam 2 kwintal" | Bayam, 200 kg, 2026-10-14, harga kosong (`missing: ["askingPrice"]`) |
| "kangkung 1 ton minggu depan 7rb" | Kangkung, 1000 kg, 2026-10-19, 7.000 |
| "ada lele 50 kilo tgl 15 harga 30.000" | Ikan lele, 50 kg, 2026-10-15, 30.000 |
| "tomat 75 kg, wortel 40 kg besok" | Dua kandidat (tomat 75 kg, wortel 40 kg), keduanya 2026-10-13, harga kosong |
| "panen cabe 300 gram besok" | Cabai rawit, 0,3 kg, 2026-10-13 (peringatan: jumlah sangat kecil) |
| "besok panen" | Tidak ada kandidat; pesan "Komoditas dan jumlah belum terbaca" |
| "bayam 100 kg harga 3 ribu" | Kandidat valid + peringatan: harga di bawah harga dasar; simpan akan ditolak M3 sampai harga dinaikkan |

### 3.7 UI

Di `/supplier/stock` tambah kotak "Tulis stok dengan kalimat" di atas form. Hasil mengisi form otomatis dengan penanda "dibaca otomatis"; pemasok wajib menekan **Simpan** setelah memeriksa. Simpan teks asli ke `sourceText`.

## 4. Modul B: penilaian mutu dari foto (computer vision)

- **Tujuan:** memberi skor saran 0 sampai 100 dan kelas (segar/layu/cacat) dari foto, untuk memprioritaskan antrean pengawas.
- **Endpoint:** `POST /ai/quality-score` (multipart foto + `commodityId`) → `{ score, label, confidence }`. Hasil disimpan di `QualityCheck.aiSuggestedScore` **hanya sebagai pembanding**; skor resmi tetap hasil checklist pengawas.
- **Pendekatan:** transfer learning dari model klasifikasi gambar ringan (mis. MobileNet/EfficientNet-Lite), mulai dari **1 sampai 2 komoditas** (mis. cabai rawit dan tomat).
- **Data:** kumpulkan sendiri puluhan sampai ratusan foto per kelas dengan pencahayaan beragam; pisahkan latih/uji (80/20); laporkan akurasi dan matriks kebingungan.
- **Pengaman:** `confidence < 0,7` → tidak ditampilkan sebagai saran; tampilkan label "Perlu pemeriksaan manual".
- **UI:** pada formulir QC tampilkan "Saran AI: Segar (82%)" di samping checklist, bukan menggantikannya.

## 5. Modul C: OCR nota/timbangan

- Foto nota/layar timbangan → angka berat dan nama barang → dicocokkan dengan order untuk mengisi `receivedQuantity` sebagai **usulan**.
- Pustaka OCR siap pakai (mis. Tesseract atau EasyOCR) dengan pra-proses (rotasi, kontras).
- Selisih terhadap order ditandai untuk ditinjau manusia.

## 6. Modul D: prediksi pasokan (opsional)

Rata-rata bergerak atau regresi sederhana dengan faktor musim dari riwayat `HarvestPlan` dan `SupplyOffer`. Tampilkan sebagai garis putus-putus "perkiraan" pada kalender. Dikerjakan hanya jika semua modul lain selesai.

## 7. Struktur layanan AI (saat dikerjakan)

```
ai-service/
  app/main.py            # FastAPI
  app/routers/ nlp.py vision.py ocr.py forecast.py health.py
  app/nlp/ commodities.py quantities.py dates.py prices.py
  tests/                 # uji kasus pada bagian 3.6
  requirements.txt
  Dockerfile
```

Tambahkan layanan ini ke `docker-compose.yml` hanya saat fase AI dibuka.

## 8. Kriteria selesai modul AI

- [ ] Semua kasus uji pada 3.6 lulus (untuk modul A)
- [ ] Jalur manual tetap berfungsi saat layanan AI mati
- [ ] Hasil AI tidak pernah tersimpan tanpa konfirmasi pengguna
- [ ] Akurasi dan batasan dilaporkan di dokumen (untuk bahan naskah lomba)
