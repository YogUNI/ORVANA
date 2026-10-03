# 03. Alur Pengguna dan Siklus Status

Diagram memakai Mermaid (dapat dirender di GitHub, VS Code, dan banyak IDE).

## 1. Alur end-to-end

```mermaid
flowchart TD
  A[Dapur: susun menu dan porsi] --> B[Sistem: hitung kebutuhan bahan per tanggal]
  B --> C[Dapur: tinjau lalu terbitkan permintaan]
  C --> D{"Harga maks ≥ harga dasar?"}
  D -- tidak --> C
  D -- ya --> E[Sistem: pencocokan dan alokasi]
  E --> F[Order PROPOSED dikirim ke pemasok]
  F --> G{Pemasok menjawab dalam batas waktu?}
  G -- terima --> H[Order ACCEPTED, ledger HOLD]
  G -- tolak atau lewat waktu --> I[Reservasi dilepas, alokasi ulang ke pemasok berikutnya]
  I --> E
  H --> J[Koordinator: gabungkan order ke satu pengiriman]
  J --> K[Jemput, berangkat, tiba]
  K --> L[Dapur: catat penerimaan]
  L --> M[Pengawas mutu: periksa dan beri hasil]
  M --> N{Hasil QC}
  N -- lolos --> O[Ledger RELEASE penuh]
  N -- sebagian --> P[Ledger RELEASE sebagian dan VOID sisa]
  N -- ditolak --> Q[Ledger VOID, skor pemasok turun]
  O --> R[Batch tertelusur dan QR publik]
  P --> R
  Q --> S{Ada keberatan dalam 48 jam?}
  S -- ya --> T[Sengketa, admin memutus, ledger ADJUSTMENT]
  S -- tidak --> U[Order COMPLETED]
  R --> U
  T --> U
  U --> V[Dashboard dampak dan audit]
```

## 2. Siklus status order

```mermaid
stateDiagram-v2
  [*] --> PROPOSED
  PROPOSED --> ACCEPTED: pemasok terima
  PROPOSED --> REJECTED: pemasok tolak
  PROPOSED --> EXPIRED: lewat batas waktu
  REJECTED --> [*]: alokasi ulang membuat order baru
  EXPIRED --> [*]: alokasi ulang membuat order baru
  ACCEPTED --> CONSOLIDATED: masuk pengiriman
  ACCEPTED --> CANCELLED: dibatalkan admin atau pemasok
  CONSOLIDATED --> IN_TRANSIT: pengiriman berangkat (batch dibuat)
  IN_TRANSIT --> RECEIVED: dapur catat penerimaan
  RECEIVED --> QC_PASSED: hasil PASS
  RECEIVED --> QC_PARTIAL: hasil PARTIAL
  RECEIVED --> QC_FAILED: hasil FAIL
  QC_PASSED --> PAID: ledger RELEASE
  QC_PARTIAL --> PAID: ledger RELEASE sebagian
  QC_FAILED --> DISPUTED: diajukan sengketa
  QC_PASSED --> DISPUTED
  QC_PARTIAL --> DISPUTED
  PAID --> DISPUTED
  DISPUTED --> PAID: diputus admin (ADJUSTMENT)
  PAID --> COMPLETED: jendela sengketa berakhir
  QC_FAILED --> COMPLETED: jendela sengketa berakhir
  COMPLETED --> [*]
  CANCELLED --> [*]
```

Pemetaan istilah ke bahasa Indonesia: PROPOSED = Ditawarkan, ACCEPTED = Disanggupi, CONSOLIDATED = Dikonsolidasi,
IN_TRANSIT = Dikirim, RECEIVED = Diterima, QC_PASSED = Lolos mutu, QC_PARTIAL = Lolos sebagian,
QC_FAILED = Ditolak/Retur, DISPUTED = Sengketa, PAID = Dibayar, COMPLETED = Selesai.

Aturan transisi ditegakkan di `OrdersService.transition(orderId, to, actor)`. Transisi di luar tabel di atas ditolak dengan kode `INVALID_TRANSITION`.
Setiap transisi menulis `AuditLog`.

## 3. Status permintaan (DemandRequest)

`DRAFT` → `OPEN` (diterbitkan, pencocokan berjalan) → `MATCHING` (ada order PROPOSED) → `PARTIALLY_FULFILLED` atau `FULFILLED`
(sesuai total kuantitas order yang sudah ACCEPTED atau lebih lanjut) → atau `CANCELLED`.

## 4. Status pengiriman

`PLANNED` → `PICKING_UP` → `IN_TRANSIT` → `ARRIVED` (atau `CANCELLED` sebelum IN_TRANSIT).
- `PLANNED`: order menjadi CONSOLIDATED.
- `IN_TRANSIT`: batch dibuat untuk tiap order; order menjadi IN_TRANSIT.
- `ARRIVED`: koordinator mengisi susut (jika ada); dapur kemudian mencatat penerimaan per order.

## 5. Sequence: pencocokan dan alokasi

```mermaid
sequenceDiagram
  actor K as Pengelola Dapur
  participant API
  participant M as MatchingService
  participant DB
  actor S as Pemasok
  K->>API: POST /demand-requests (publish)
  API->>M: match(demandId)
  M->>DB: ambil kandidat SupplyOffer aktif
  M->>M: filter, hitung skor, alokasi (maks share)
  M->>DB: transaksi: buat Order PROPOSED dan naikkan quantityReserved
  API-->>K: ringkasan alokasi
  API-->>S: notifikasi tawaran order
  S->>API: POST /orders/:id/accept
  API->>DB: Order ACCEPTED dan LedgerEntry HOLD
  Note over API,DB: Jika tolak atau kedaluwarsa, reservasi dilepas dan match(demandId) dipanggil lagi untuk sisa kuantitas
```

## 6. Sequence: penerimaan, QC, dan pembayaran

```mermaid
sequenceDiagram
  actor D as Pengelola Dapur
  actor Q as Pengawas Mutu
  participant API
  participant DB
  D->>API: POST /orders/:id/receive (jumlah diterima, foto)
  API->>DB: Order RECEIVED, Batch.receivedQuantity
  Q->>API: POST /batches/:id/quality-checks (checklist, diterima, ditolak)
  API->>DB: transaksi: QualityCheck, status order, LedgerEntry, skor pemasok
  API-->>D: notifikasi hasil
  API-->>Q: sertifikat batch tersedia
```

## 7. Alur per peran (ringkas)

**Pengelola dapur:** daftar → diverifikasi → buat menu mingguan → lihat kebutuhan → terbitkan permintaan → pantau order → terima barang → (opsional) ulas pemasok → ajukan sengketa bila perlu.

**Pemasok:** daftar → diverifikasi → isi profil dan lokasi → isi rencana panen dan stok → terima notifikasi order → terima/tolak (dalam 12 jam) → serahkan ke titik kumpul → pantau pembayaran dan skor.

**Koordinator:** lihat order siap kirim → pilih order (dapur dan tanggal sama) → buat pengiriman → ubah status (jemput, berangkat, tiba) → catat susut dan biaya angkut.

**Pengawas mutu:** lihat antrean batch → isi checklist dan jumlah diterima/ditolak → terbitkan hasil → beri umpan balik pemasok.

**Admin:** verifikasi akun → atur data master, harga acuan, dan parameter → pantau dashboard → putuskan sengketa → telusuri audit.

**Auditor/publik:** buka dashboard dampak → telusuri batch via QR atau kode → lihat ringkasan ledger teranonimkan.

## 8. Kasus tepi yang harus ditangani

| Situasi | Perilaku yang diharapkan |
|---|---|
| Tidak ada kandidat pemasok | Permintaan tetap `OPEN`, dapur dan admin diberi notifikasi "pasokan belum tersedia" |
| Pasokan kurang dari kebutuhan | Order dibuat untuk yang tersedia, permintaan `PARTIALLY_FULFILLED` dengan sisa kuantitas ditampilkan |
| Pemasok menolak/kedaluwarsa | Reservasi dilepas, pemasok itu dikecualikan untuk permintaan tersebut, alokasi ulang untuk sisa |
| Stok pemasok berubah saat ada order PROPOSED | Tidak boleh mengurangi stok di bawah `quantityReserved` |
| Dapur membatalkan permintaan yang sudah punya order | Hanya jika semua order masih PROPOSED/ACCEPTED; order dibatalkan dan reservasi dilepas; pemasok diberi tahu |
| Jumlah diterima berbeda lebih dari 2 persen dari dikirim | Ditandai "selisih" dan wajib diberi catatan |
| QC dikirim dua kali | Ditolak (satu QC final per batch); koreksi lewat sengketa admin |
| Dua koordinator memilih order yang sama | Transaksi dengan pemeriksaan status; yang kedua mendapat `ORDER_ALREADY_CONSOLIDATED` |
