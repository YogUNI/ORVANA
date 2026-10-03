# 02. Peran dan Hak Akses

## 1. Prinsip

1. Akses ditentukan oleh `User.role` (enum `Role`) dan **kepemilikan data** (scoping).
2. Backend adalah penentu akhir. Frontend hanya menyembunyikan menu; setiap endpoint tetap memeriksa guard.
3. Prinsip hak minimum: jika ragu, tolak (403).
4. Data pribadi tidak muncul di halaman publik.

## 2. Pendaftaran dan verifikasi

| Peran | Cara akun dibuat | Status awal |
|---|---|---|
| KITCHEN_MANAGER | Mendaftar sendiri, memilih/mendaftarkan dapur | PENDING (menunggu admin) |
| SUPPLIER | Mendaftar sendiri, mengisi profil dan lokasi | PENDING |
| COORDINATOR | Mendaftar sendiri, mengisi titik kumpul | PENDING |
| QUALITY_INSPECTOR | Dibuat admin | ACTIVE |
| ADMIN | Dibuat lewat seed atau admin lain | ACTIVE |
| AUDITOR | Dibuat admin | ACTIVE |

- Akun `PENDING` dapat login tetapi hanya melihat layar "Menunggu verifikasi admin" (tidak bisa memakai fitur).
- Admin dapat mengaktifkan (`ACTIVE`) atau menangguhkan (`SUSPENDED`). Akun `SUSPENDED` ditolak saat login dan refresh token.
- Pendaftaran publik **tidak boleh** memilih peran ADMIN, QUALITY_INSPECTOR, atau AUDITOR.

## 3. Deskripsi peran

### ADMIN (admin dinas/pembina)
- Mengelola pengguna dan verifikasi akun, data master (komoditas, resep, standar mutu, wilayah), harga acuan, dan pengaturan sistem.
- Memicu atau mengulang pencocokan bila perlu, membatalkan order, memutus sengketa, memantau dashboard wilayah, melihat log audit.
- Scope: seluruh data pada wilayah yang dipegangnya (MVP: seluruh data).

### KITCHEN_MANAGER (pengelola dapur)
- Menyusun menu dan porsi, membuat/menerbitkan permintaan, memantau order dan pengiriman, mencatat penerimaan, memberi ulasan pemasok, mengajukan sengketa.
- Scope: hanya data dapur yang ia kelola (`Kitchen.managerId`).

### SUPPLIER (petani/nelayan/UMKM)
- Mengelola profil, stok (supply offer), dan rencana panen; melihat kalender permintaan agregat; menerima atau menolak order; mengunggah foto bukti; melihat riwayat pembayaran dan skor.
- Scope: hanya data miliknya (`SupplierProfile.userId`).

### COORDINATOR (koordinator/pengepul)
- Melihat order yang sudah disanggupi di wilayahnya, membuat pengiriman gabungan, memperbarui status pengiriman, mencatat susut dan biaya angkut.
- Scope: pengiriman yang ia buat; daftar order "siap dikirim" pada wilayahnya.

### QUALITY_INSPECTOR (pengawas mutu/ahli gizi)
- Mengelola standar mutu (bersama admin), memproses antrean pemeriksaan, mengisi formulir QC, menerbitkan hasil, memberi umpan balik.
- Scope: batch pada wilayahnya.

### AUDITOR (auditor publik, hanya lihat)
- Melihat ringkasan buku catatan, indikator dampak, dan penelusuran batch. **Tidak dapat mengubah data apa pun.**
- Data pribadi dan identitas pemasok disamarkan sesuai aturan privasi (bagian 6).

### Pengunjung publik (tanpa login)
- Halaman landing dengan ringkasan dampak teragregasi dan halaman `/trace/:batchCode`.

## 4. Matriks hak akses modul

K = kelola (buat/ubah data yang menjadi bagiannya), L = hanya lihat, `-` = tidak ada akses.

| Modul | Dapur | Pemasok | Koord. | Mutu | Admin | Auditor |
|---|---|---|---|---|---|---|
| Menu dan permintaan | K | - | L | - | L | - |
| Stok dan kalender panen | L | K | L | - | L | - |
| Pencocokan dan order | L | K (jawab order sendiri) | L | - | K | - |
| Konsolidasi dan pengiriman | L | L | K | - | L | - |
| Penerimaan dan pemeriksaan mutu | K | L | - | K | L | L |
| Standar mutu | L | L | - | K | K | - |
| Pembayaran dan ledger | L | L | - | - | K | L |
| Harga acuan dan aturan | L | L | L | L | K | L |
| Sengketa | K (ajukan/tanggapi) | K (ajukan/tanggapi) | - | L | K (putus) | - |
| Dashboard dampak | L | L | - | - | L | L |
| Jejak asal bahan | L | L | L | L | L | L |
| Log audit | - | - | - | - | L | - |
| Pengguna dan data master | - | - | - | - | K | - |

## 5. Aturan kepemilikan (scoping) per sumber daya

| Sumber daya | Aturan |
|---|---|
| `Kitchen`, `MenuPlan`, `DemandRequest` | Dapur hanya miliknya; admin semua; peran lain L sesuai matriks, dibatasi wilayah |
| `SupplyOffer`, `HarvestPlan` | Pemasok hanya miliknya; dapur/admin boleh lihat tawaran aktif pada wilayahnya |
| `Order` | Dapur: order dapurnya. Pemasok: order miliknya. Koordinator: order `ACCEPTED/CONSOLIDATED/IN_TRANSIT` di wilayahnya. Admin: semua |
| `Shipment` | Koordinator pembuat; dapur tujuan (L); admin |
| `Batch`, `QualityCheck` | Mutu: wilayahnya. Dapur dan pemasok terkait: L. Admin: semua |
| `LedgerEntry` | Dapur dan pemasok terkait: L. Admin: K. Auditor: ringkasan teranonimkan |
| `Dispute` | Pihak yang terlibat pada order tersebut dan admin |
| `Notification` | Hanya pemilik |
| `AuditLog` | Hanya admin |

Implementasi: buat decorator `@Roles(...)`, `RolesGuard`, dan helper `scopeWhere(user)` di `common/` yang dipakai semua service.

## 6. Privasi pada tampilan publik dan auditor

- Halaman `/trace/:batchCode` menampilkan: komoditas, nama wilayah/desa asal (bukan alamat persis), tanggal panen, tanggal kirim dan terima,
  hasil mutu (lolos/sebagian/ditolak), nama dapur tujuan.
- Nama pemasok hanya tampil bila `SupplierProfile.publicName = true`; selain itu disamarkan (contoh: "Petani T*** (Kelompok Tani)").
- Auditor melihat nominal agregat dan entri ledger dengan identitas pemasok disamarkan; tidak ada nomor telepon, email, atau alamat.
- Foto bukti tidak ditampilkan di halaman publik.

## 7. Token dan sesi

- Access token JWT (15 menit) memuat `sub`, `role`, `status`, `regionId`. Refresh token (7 hari) disimpan di cookie `httpOnly` (atau kirim di body pada mode dev) dan dirotasi saat dipakai.
- Logout mencabut refresh token. Ganti status akun ke `SUSPENDED` harus mencabut semua refresh token milik pengguna.
- Rute di frontend dilindungi `RequireRole` dan mengarahkan ke dashboard sesuai peran setelah login.

## 8. Rute dashboard per peran (frontend)

| Peran | Prefix rute |
|---|---|
| KITCHEN_MANAGER | `/kitchen/*` |
| SUPPLIER | `/supplier/*` |
| COORDINATOR | `/coordinator/*` |
| QUALITY_INSPECTOR | `/inspector/*` |
| ADMIN | `/admin/*` |
| AUDITOR | `/auditor/*` |
| Publik | `/`, `/trace/:batchCode`, `/login`, `/register` |
