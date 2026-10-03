# 04. Aturan Bisnis

Semua angka default berada di tabel `SystemSetting` (dapat diubah admin) kecuali disebut tetap. Agent **tidak boleh** mengganti rumus atau default tanpa memperbarui dokumen ini.

## 0. Pengaturan sistem (`SystemSetting`)

| Kunci | Nilai default | Arti |
|---|---|---|
| `matching.weights` | `{distance:0.30, quality:0.30, price:0.20, freshness:0.10, reliability:0.10}` | Bobot skor (jumlah harus 1.0, divalidasi saat disimpan) |
| `matching.maxRadiusKm` | `50` | Jarak maksimum untuk skor jarak |
| `matching.maxSharePerSupplier` | `0.6` | Porsi maksimum satu pemasok dari satu permintaan |
| `matching.minSupplierQuality` | `60` | Skor mutu minimum pemasok agar menjadi kandidat |
| `order.responseWindowHours` | `12` | Batas waktu pemasok menjawab tawaran |
| `order.disputeWindowHours` | `48` | Jendela pengajuan sengketa setelah hasil QC |
| `qc.defaultPassScore` | `70` | Skor lulus bila komoditas tidak punya standar khusus |
| `supplier.qualityEmaAlpha` | `0.2` | Bobot hasil QC terbaru pada skor mutu pemasok |
| `supplier.reliabilityEmaAlpha` | `0.2` | Bobot hasil ketepatan waktu terbaru |
| `supplier.newReliabilityDefault` | `0.8` | Keandalan awal pemasok baru (kurang dari 3 order) |
| `harvest.gapLowRatio` | `0.8` | Pasokan/permintaan di bawah ini = "Kurang" |
| `harvest.gapHighRatio` | `1.3` | Pasokan/permintaan di atas ini = "Berlebih" |
| `price.enforceFloor` | `true` | Tolak permintaan dengan harga maks di bawah harga dasar |
| `receive.discrepancyTolerancePct` | `2` | Toleransi selisih kirim vs terima |
| `ledger.hashChainEnabled` | `false` | Aktifkan hash berantai (P2) |

## 1. Satuan, pembulatan, format

- Semua komoditas MVP memakai **kg**. Kuantitas `Decimal(12,3)`; tampil 1 desimal bila bukan bilangan bulat (`12,5 kg`).
- Rupiah `Decimal(14,0)`. Harga per kg adalah bilangan bulat. Total = `ROUND(quantity * pricePerUnit)` (pembulatan ke rupiah terdekat, `ROUND_HALF_UP`).
- Tanggal layanan/panen/kebutuhan adalah tanggal (tanpa jam) di zona `Asia/Jakarta`.
- Hitung dengan `Decimal` (mis. `decimal.js` atau tipe Prisma Decimal), jangan `float`, untuk uang dan kuantitas.

## 2. Perencana kebutuhan bahan

Masukan: `MenuPlan(kitchenId, serviceDate, recipeId, portions)` dan `Recipe` dengan `RecipeItem(commodityId, quantityPerPortion)` (kg per porsi).

Untuk setiap komoditas `c` pada tanggal `d`:

```
baseQty(c,d)   = Σ over MenuPlan di d:  portions * quantityPerPortion(c)
needQty(c,d)   = baseQty(c,d) * (1 + wastePercent(c)/100)      // dibulatkan ke atas 0,1 kg
```

- Hasilnya adalah **draf** `DemandRequest` (status `DRAFT`) per komoditas per tanggal; dapur boleh mengubah kuantitas, harga maks, dan batas mutu sebelum menerbitkan.
- Harga maks default = `PriceReference.referencePrice` komoditas di wilayah dapur; tidak boleh melebihi `ceilingPrice` (peringatan, bukan blokir).
- `minQualityScore` default = 60.
- Bila draf untuk (kitchen, commodity, neededDate) sudah ada, hasilkan ulang dengan **memperbarui** draf yang masih `DRAFT` (jangan duplikasi). Permintaan yang sudah `OPEN` tidak diubah otomatis.

Contoh: Senin, 1000 porsi resep R1 → lihat vektor uji di `09-seed-data.md`.

## 3. Validasi permintaan

- `quantity > 0`, `neededDate >= hari ini + 1` (minimal H+1).
- Jika `price.enforceFloor` aktif dan `maxPricePerUnit < floorPrice`, tolak dengan kode `PRICE_BELOW_FLOOR` dan pesan:
  "Harga maksimum berada di bawah harga dasar produsen (Rp X). Naikkan harga agar tetap adil bagi petani."
- Dapur hanya boleh membuat permintaan untuk komoditas aktif.

## 4. Pencocokan pasokan (matching)

### 4.1 Kandidat

Sebuah `SupplyOffer` menjadi kandidat untuk `DemandRequest` bila **semua** terpenuhi:

1. `status = ACTIVE` dan `commodityId` sama.
2. `available = quantityAvailable - quantityReserved > 0`.
3. `harvestDate <= neededDate` dan `age = neededDate - harvestDate` (hari) memenuhi `age <= shelfLifeDays(commodity)`.
4. `askingPrice <= maxPricePerUnit` dan `askingPrice >= floorPrice` (harga ajuan pemasok tidak boleh di bawah harga dasar; jika di bawah, naikkan otomatis ke floor saat membuat penawaran, atau tolak input dengan pesan jelas).
5. Pemasok `ACTIVE`, `qualityScore >= max(matching.minSupplierQuality, demand.minQualityScore)`.
6. `distanceKm <= matching.maxRadiusKm * 2` (batas keras; di atas `maxRadiusKm` skor jarak 0).
7. Pemasok belum pernah menolak/kedaluwarsa pada permintaan yang sama.

### 4.2 Skor (0 sampai 100)

```
distanceKm   = haversine(supplier.lat, supplier.lng, kitchen.lat, kitchen.lng)
sDistance    = max(0, 1 - distanceKm / matching.maxRadiusKm)
sQuality     = supplier.qualityScore / 100
sPrice       = askingPrice <= referencePrice ? 1 : max(0, 1 - (askingPrice - referencePrice) / referencePrice)
sFreshness   = 1 - age / shelfLifeDays
sReliability = supplier.reliabilityRate          // 0..1

matchScore = 100 * ( wD*sDistance + wQ*sQuality + wP*sPrice + wF*sFreshness + wR*sReliability )
```

Pembulatan tampilan 2 desimal. Haversine memakai radius bumi 6371 km.

### 4.3 Alokasi (greedy dengan batas porsi)

```
remaining = demand.quantity - Σ(quantity order aktif untuk demand ini: PROPOSED/ACCEPTED/lanjutan)
urutkan kandidat menurun menurut matchScore (tie-break: jarak terdekat, lalu id)
untuk setiap kandidat:
    cap   = demand.quantity * matching.maxSharePerSupplier
    alloc = min(remaining, available, cap)
    jika alloc <= 0: lanjut
    buat Order(PROPOSED, quantity=alloc, pricePerUnit = askingPrice, matchScore, offerExpiresAt = now + responseWindowHours)
    offer.quantityReserved += alloc
    remaining -= alloc
    jika remaining == 0: berhenti
```

- Harga order = `askingPrice` pemasok (selalu <= `maxPricePerUnit`).
- Jika hanya satu kandidat dan `cap < remaining`, alokasikan `cap` saja; sisanya tetap terbuka (permintaan `PARTIALLY_FULFILLED`/`OPEN`). Tujuannya menyebar risiko.
- Seluruh alokasi dalam **satu transaksi** dengan penguncian baris offer (`SELECT ... FOR UPDATE` atau update bersyarat) untuk mencegah double-allocation.
- Setelah pemasok menolak atau tawaran kedaluwarsa: kurangi `quantityReserved`, tandai pemasok dikecualikan untuk permintaan itu, jalankan alokasi lagi untuk sisa kuantitas.
- Saat order `ACCEPTED`, `quantityReserved` tetap (sudah dialokasikan). Saat order selesai/dikirim, kurangi `quantityAvailable` dan `quantityReserved` sebesar kuantitas order. Jika `quantityAvailable == 0`, offer menjadi `DEPLETED`.

### 4.4 Status permintaan setelah alokasi

- `fulfilledQty = Σ quantity order berstatus ACCEPTED dan seterusnya (bukan REJECTED/EXPIRED/CANCELLED)`; `pendingQty = Σ order PROPOSED`.
- `FULFILLED` bila `fulfilledQty >= quantity`; `PARTIALLY_FULFILLED` bila `fulfilledQty > 0` tapi kurang; `MATCHING` bila hanya ada order PROPOSED; `OPEN` bila belum ada order.

## 5. Kalender panen kolektif

Untuk wilayah `r`, komoditas `c`, dan minggu `w` (Senin sampai Minggu) dalam 4 minggu ke depan:

```
demand(c,w) = Σ DemandRequest.quantity (status OPEN..FULFILLED) + Σ kebutuhan dari MenuPlan yang belum diterbitkan
supply(c,w) = Σ HarvestPlan.expectedQuantity + Σ SupplyOffer.available (harvestDate di minggu w)
ratio       = supply / demand
label       = "Kurang" jika ratio < harvest.gapLowRatio, "Berlebih" jika ratio > harvest.gapHighRatio, selain itu "Cukup"
```

Jika `demand = 0`: label "Belum ada permintaan". Pemasok melihat agregat per komoditas (tanpa identitas dapur tertentu) dan saran: "Kurang, pertimbangkan menanam/memanen komoditas ini".

## 6. Kontrol mutu

### 6.1 Standar dan skor

- Setiap komoditas memiliki `QualityStandard(passScore, checklist[])`; setiap item `{key, label, weight}` dengan jumlah bobot 100.
- Inspektur memberi nilai 0 sampai 100 per item. `score = Σ (nilai_item * weight / 100)` dibulatkan ke bilangan bulat terdekat.
- Item checklist default (bila belum dikonfigurasi): kesegaran (40), kondisi fisik/cacat (25), keseragaman ukuran (15), kebersihan (10), penanganan/suhu (10).

### 6.2 Hasil

Inspektur memasukkan `receivedQuantity` (otomatis dari catatan penerimaan), `acceptedQuantity`, `rejectedQuantity` dengan `accepted + rejected = received` (toleransi 0).

| Kondisi | `result` | Status order |
|---|---|---|
| `rejected = 0` dan `score >= passScore` | `PASS` | `QC_PASSED` |
| `accepted > 0` dan `rejected > 0` | `PARTIAL` | `QC_PARTIAL` |
| `accepted = 0` | `FAIL` | `QC_FAILED` |
| `rejected = 0` tetapi `score < passScore` | tidak valid; wajib menolak sebagian atau seluruhnya | validasi `SCORE_BELOW_PASS_REQUIRES_REJECTION` |

Setiap penolakan (`rejected > 0`) wajib `notes` minimal 10 karakter dan sebaiknya foto.

### 6.3 Pembaruan skor pemasok

```
qualityScore_new = (1 - alpha) * qualityScore_old + alpha * checkScore      // alpha = supplier.qualityEmaAlpha
```
Dibatasi 0 sampai 100, 2 desimal. Untuk `FAIL`, gunakan `checkScore` yang diinput (tidak otomatis 0).

### 6.4 Keandalan

Saat shipment `ARRIVED` untuk sebuah order:

```
onTime = (arrivedAt <= akhir hari neededDate Asia/Jakarta) ? 1 : 0
reliability_new = (1 - a) * reliability_old + a * onTime       // a = supplier.reliabilityEmaAlpha
```
Jika `totalOrders < 3`, gunakan `supplier.newReliabilityDefault` pada perhitungan skor pencocokan. Pembatalan oleh pemasok setelah `ACCEPTED` dihitung `onTime = 0`.

## 7. Pembayaran bertahap (ledger)

Ledger hanya **pencatatan**, tidak memindahkan uang.

| Peristiwa | Entri | Jumlah |
|---|---|---|
| Order `ACCEPTED` | `HOLD` | `ROUND(quantity * pricePerUnit)` |
| QC `PASS` | `RELEASE` | `ROUND(acceptedQuantity * pricePerUnit)` (sama dengan HOLD) |
| QC `PARTIAL` | `RELEASE` dan `VOID` | RELEASE = `ROUND(accepted * price)`, VOID = HOLD dikurangi RELEASE |
| QC `FAIL` | `VOID` | seluruh HOLD |
| Putusan sengketa mengubah jumlah | `ADJUSTMENT` | selisih (positif menambah RELEASE, negatif mengurangi) |

Aturan:
- Invarian: untuk setiap order, `HOLD = Σ RELEASE + Σ VOID` (tanpa menghitung ADJUSTMENT). `ADJUSTMENT` bernilai +x memindahkan x dari VOID ke RELEASE (−x sebaliknya). RELEASE efektif = `Σ RELEASE + Σ ADJUSTMENT` dan VOID efektif = `Σ VOID − Σ ADJUSTMENT`; keduanya harus ≥ 0 dan jumlahnya tetap sama dengan HOLD.
- Entri ledger **tidak pernah diubah atau dihapus** (append only). Koreksi dilakukan dengan entri baru.
- Setelah RELEASE tercatat, order menjadi `PAID`.
- Biaya angkut (`Shipment.transportCost`) ditampilkan transparan per pengiriman, **tidak** dipotong dari pembayaran pemasok pada MVP.
- (P2) Hash berantai: `hash = sha256(prevHash + JSON(canonical payload entri))`; `GET /ledger/verify` menghitung ulang rantai dan melaporkan entri pertama yang tidak cocok.

## 8. Sengketa

- Pihak (dapur atau pemasok) dapat mengajukan dalam `order.disputeWindowHours` setelah hasil QC; alasan wajib (min 20 karakter), bukti opsional.
- Selama `OPEN`/`UNDER_REVIEW`, order `DISPUTED` dan tidak boleh menjadi `COMPLETED`.
- Admin memutus: `FAVOR_SUPPLIER` (terima kuantitas penuh yang diterima), `FAVOR_KITCHEN` (pertahankan hasil QC), atau `SPLIT` (admin menetapkan `adjustedAcceptedQuantity`).
- Keputusan menghasilkan entri `ADJUSTMENT` dan, bila perlu, pembaruan skor pemasok (tidak otomatis).
- Setelah diputus, order kembali ke `PAID` lalu `COMPLETED` pada tutup jendela.

## 9. Penyelesaian otomatis dan tugas terjadwal (@nestjs/schedule)

| Tugas | Interval | Aksi |
|---|---|---|
| Kedaluwarsa tawaran | tiap 5 menit | Order `PROPOSED` dengan `offerExpiresAt < now` → `EXPIRED`, lepas reservasi, alokasi ulang |
| Penyelesaian order | tiap jam | `PAID` atau `QC_FAILED` yang melewati `disputeWindowHours` tanpa sengketa → `COMPLETED` |
| Kedaluwarsa stok | tiap hari 00:05 | `SupplyOffer` dengan `harvestDate + shelfLifeDays < hari ini` → `EXPIRED` |
| Pengingat | tiap 30 menit | Notifikasi untuk tawaran yang tersisa < 2 jam |

Semua tugas **idempoten** dan aman dijalankan ulang.

## 10. Metrik dampak (dashboard)

Periode `[from, to]` dan wilayah opsional.

| Metrik | Definisi |
|---|---|
| Nilai belanja lokal | Σ `RELEASE` (dikurangi koreksi) untuk order yang pemasoknya berada di wilayah yang sama dengan dapur |
| Produsen terlibat | Jumlah pemasok berbeda dengan ≥ 1 order yang RELEASE efektifnya > 0 |
| Tingkat pemenuhan | Σ `acceptedQuantity` / Σ `DemandRequest.quantity` (permintaan dengan `neededDate` di periode) |
| Tingkat penolakan | Σ `rejectedQuantity` / Σ `receivedQuantity` |
| Tingkat lolos mutu | batch `PASS` / total batch yang diperiksa |
| Jarak tempuh rata-rata | rata-rata tertimbang kuantitas dari `distanceKm` pemasok ke dapur (haversine) |
| Premi harga vs acuan | rata-rata tertimbang kuantitas dari `(pricePerUnit - referencePrice) / referencePrice` |
| Ketepatan waktu | Σ order `onTime=1` / Σ order sampai ARRIVED |
| Nilai tertahan | Σ HOLD yang belum RELEASE/VOID |

Semua metrik dihitung dari data transaksi (bukan disimpan) lewat query agregat; cache pendek (60 detik) opsional.

## 11. Aturan penomoran

- Order: `ORD-{YYYYMMDD}-{seq4}` (seq harian global).
- Pengiriman: `SHP-{YYYYMMDD}-{seq3}`.
- Batch: `ORV-{YYYYMMDD}-{kitchen.code}-{seq4}` dengan tanggal = tanggal berangkat, seq per dapur per hari. Contoh: `ORV-20261012-DPR01-0007`.
- Dibuat dalam transaksi menggunakan tabel penghitung atau `MAX+1` dengan penguncian agar unik.

## 12. Notifikasi (dalam aplikasi)

| Peristiwa | Penerima |
|---|---|
| Akun diverifikasi/ditangguhkan | Pemilik akun |
| Tawaran order baru | Pemasok |
| Tawaran hampir kedaluwarsa | Pemasok |
| Order ditolak/kedaluwarsa dan sisa belum terpenuhi | Dapur, admin |
| Order disanggupi | Dapur, koordinator wilayah |
| Pengiriman dibuat/berangkat/tiba | Dapur, pemasok terkait |
| Batch menunggu QC | Pengawas mutu wilayah |
| Hasil QC | Dapur, pemasok |
| Pembayaran tercatat (RELEASE) | Pemasok |
| Sengketa diajukan/diputus | Pihak terkait, admin |
