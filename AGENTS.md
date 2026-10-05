# AGENTS.md: ORVANA

> Baca file ini dulu, lalu baca dokumen di `docs/` yang relevan dengan tugasmu SEBELUM menulis kode.
> Jika dokumen dan permintaan pengguna bertentangan, tanyakan dulu. Jangan menebak.

## 1. Apa proyek ini

**ORVANA** adalah aplikasi web multi-peran yang mengelola rantai pasok pangan lokal untuk **dapur gizi massal**.
Sistem menghitung kebutuhan bahan dari menu, mencocokkannya dengan stok dan jadwal panen petani/nelayan lokal,
mengatur pengiriman lewat koordinator, memeriksa mutu, mencatat pembayaran bertahap, dan menyimpan jejak asal bahan (batch).

Satu kalimat: *mencocokkan kebutuhan terjadwal dapur dengan rencana panen produsen lokal, lengkap dengan kontrol mutu, penelusuran, dan pembayaran yang transparan.*

Konteks: tugas kelompok (3 orang) mata kuliah Pemrograman Web Enterprise yang akan dilanjutkan ke lomba PHKM.
Prioritasnya: **prototipe yang berjalan penuh pada satu skenario inti** (satu dapur, beberapa pemasok), bukan banyak fitur setengah jadi.

## 2. Peran pengguna (6)

`ADMIN` (admin dinas/pembina), `KITCHEN_MANAGER` (pengelola dapur), `SUPPLIER` (petani/nelayan),
`COORDINATOR` (koordinator/pengepul), `QUALITY_INSPECTOR` (pengawas mutu/ahli gizi), `AUDITOR` (auditor publik, hanya lihat).
Ditambah halaman publik tanpa login: `/trace/:batchCode` dan landing dengan ringkasan dampak. Detail: `docs/02-roles-permissions.md`.

## 3. Stack (final)

| Lapisan | Pilihan |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Recharts, react-leaflet |
| Backend | Node.js + NestJS (TypeScript), class-validator, @nestjs/swagger, @nestjs/schedule |
| Database | PostgreSQL 16 + Prisma ORM **versi 6.x** (`npm i prisma@6 @prisma/client@6`). Prisma 7 memindahkan `url` datasource ke `prisma.config.ts`, sehingga skema di `docs/05` tidak berlaku apa adanya |
| Auth | JWT (access 15 menit + refresh 7 hari), guard per peran |
| Upload | multer, folder lokal `backend/uploads/` |
| PDF dan QR | pustaka PDF Node (pdfkit/pdfmake) dan `qrcode` |
| Uji | Jest (backend), Vitest + Testing Library (frontend) |
| Deploy lokal | Docker Compose (db, backend, frontend) |
| AI | **DITUNDA.** NLP, foto mutu, OCR dikerjakan belakangan. Lihat `docs/08-ai-modules.md`. Jangan dibangun kecuali diminta. |

Pakai versi stabil terbaru dan kunci di `package.json`. Jangan menambah dependency besar tanpa alasan; sebutkan alasannya.

## 4. Struktur repo

```
orvana/
  AGENTS.md  GEMINI.md  docker-compose.yml  .env.example
  docs/                      # spesifikasi (sumber kebenaran)
  backend/
    prisma/ (schema.prisma, migrations/, seed.ts)
    src/
      common/ (guards, decorators, filters, interceptors, utils)
      modules/ auth users master-data menu demand supply matching orders
               shipments qc ledger disputes trace dashboard notifications audit settings uploads
  frontend/
    src/
      app/ (router, providers, layouts)
      pages/ public kitchen supplier coordinator inspector admin auditor
      features/ (komponen + hook per domain)
      components/ui/ (komponen dasar)
      lib/ (api client, format, labels, constants)
```

## 5. Perintah

```bash
docker compose up -d db                      # PostgreSQL lokal
cd backend && npm i && npx prisma migrate dev
npm run seed:demo                            # data demo (idempoten); npm run seed:reset untuk mengulang
npm run start:dev                            # API di http://localhost:3000, Swagger di /api/docs
cd ../frontend && npm i && npm run dev       # http://localhost:5173
npm test                                     # di backend/ dan frontend/
```

Variabel lingkungan (lihat `.env.example`): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`,
`FRONTEND_URL`, `UPLOAD_DIR`, `VITE_API_URL`. **Jangan pernah commit rahasia asli.**

## 6. Aturan kerja untuk agent

1. **Rencana dulu, kode kemudian.** Untuk tugas non-trivial, tulis rencana singkat (file yang disentuh, langkah, risiko) dan tunggu persetujuan.
2. **Satu tugas kecil per sesi.** Ambil tugas dari `docs/10-roadmap-tasks.md` secara berurutan. Centang kotaknya setelah selesai dan lulus uji.
3. **Jangan membangun di luar prioritas.** Kerjakan P0 dahulu, lalu P1. P2 dan modul AI hanya jika diminta eksplisit.
4. **Ikuti dokumen.** Nama tabel/kolom/enum mengikuti `docs/05-database-schema.md`; aturan hitung mengikuti `docs/04-business-rules.md`.
   Jika perlu mengubah skema atau aturan, ubah dokumennya DI COMMIT YANG SAMA.
5. **Jangan mengarang data atau angka bisnis.** Rumus, bobot, dan ambang ada di `docs/04`. Jika tidak ada, tanyakan.
6. **Keamanan:** semua rute butuh guard peran kecuali yang tertulis publik; validasi semua input di backend;
   password di-hash (bcrypt); jangan kirim `passwordHash` ke klien; periksa kepemilikan data (scoping) di setiap query.
7. **Aksi penting wajib masuk `AuditLog`** (login, ubah status order, QC, ledger, putusan sengketa, ubah pengaturan).
8. **Transaksi:** operasi yang mengubah beberapa tabel (alokasi pencocokan, penerimaan + QC + ledger) memakai `prisma.$transaction`.
9. Tulis uji untuk logika bisnis (kebutuhan bahan, skor pencocokan, alokasi, ledger). Gunakan vektor uji di `docs/09-seed-data.md` dan `docs/11-testing-demo.md`.
10. Commit kecil dengan pesan jelas (Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## 7. Konvensi

- **Bahasa:** kode, nama tabel/kolom, nama endpoint, dan komentar teknis dalam **bahasa Inggris**. **Teks UI dalam bahasa Indonesia** (kumpulkan di `frontend/src/lib/labels.ts`).
- **API:** REST di `/api/v1`, JSON. Sukses: `{ "data": ..., "meta": {...} }`. Gagal: `{ "error": { "code": "...", "message": "...", "details": ... } }`.
  Paginasi `?page=1&limit=20`. Tanggal ISO 8601; zona waktu tampilan `Asia/Jakarta`.
- **Satuan:** semua komoditas MVP memakai **kg**. Rupiah disimpan `Decimal(14,0)` (tanpa sen); kuantitas `Decimal(12,3)`.
- **Format tampilan:** `Rp 1.250.000`, `12,5 kg`, tanggal `12 Okt 2026` (locale `id-ID`).
- **Penamaan:** file `kebab-case`, komponen React `PascalCase`, variabel `camelCase`, enum `UPPER_SNAKE_CASE`.
- **TypeScript ketat** (`strict: true`), tanpa `any` kecuali dengan komentar alasan.
- Tidak ada logika bisnis di controller; taruh di service. Komponen React tidak memanggil `fetch` langsung; pakai hook di `features/`.

## 8. Definisi selesai (DoD) untuk setiap tugas

- [ ] Sesuai spesifikasi di `docs/06-feature-specs.md` (kriteria penerimaan terpenuhi)
- [ ] Guard peran dan scoping data benar
- [ ] Validasi input + pesan error berbahasa Indonesia di UI
- [ ] Ada uji untuk logika bisnis yang disentuh; `npm test` hijau
- [ ] State loading, kosong, dan error tertangani di UI; tampilan responsif (cek lebar 375 px)
- [ ] Dokumen di `docs/` diperbarui jika skema/aturan berubah; checklist roadmap dicentang

## 9. Peta dokumen

| File | Isi |
|---|---|
| `docs/01-product-brief.md` | Masalah, solusi, pengguna, tujuan, non-goals, istilah |
| `docs/02-roles-permissions.md` | Peran, hak akses, scoping data, registrasi dan verifikasi |
| `docs/03-user-flows.md` | Alur per peran, alur end-to-end, siklus status (diagram Mermaid) |
| `docs/04-business-rules.md` | Rumus kebutuhan, pencocokan, mutu, pembayaran, sengketa, metrik dampak |
| `docs/05-database-schema.md` | Skema Prisma lengkap, enum, indeks, aturan integritas |
| `docs/06-feature-specs.md` | Spesifikasi per modul: endpoint, halaman, kriteria penerimaan, prioritas |
| `docs/07-ui-ux-guidelines.md` | Gaya visual, peta halaman, pola komponen, salinan teks |
| `docs/08-ai-modules.md` | Rancangan modul AI (ditunda) |
| `docs/09-seed-data.md` | Data demo dan vektor uji bernilai konkret |
| `docs/10-roadmap-tasks.md` | Tahap dan checklist tugas |
| `docs/11-testing-demo.md` | Strategi uji, skenario E2E, skrip demo lomba |
| `docs/12-quality-audit-future-roadmap.md` | Audit mutu komprehensif dan roadmap aksi masa depan |
