# 13. Roadmap & Task List Pengujian AI Agent ORVANA

Dokumen ini mendefinisikan rencana kerja detail, skenario pengujian komprehensif (*unit*, *integration*, *behavioral/tone*, dan *stress test*), serta tolok ukur kesiapan (*Definition of Done*) untuk seluruh fitur **AI AGENT ORVANA** (termasuk Chatbot AI Concierge dan Microservice NLP/CV).

---

## 1. Ringkasan Tujuan
Memastikan Asisten AI ORVANA:
1. **100% Grounded & Akurat**: Tidak berhalusinasi, selalu merujuk pada regulasi dan data bisnis `docs/01-12`.
2. **Adaptif & Pacing Alami**: Merespons ringkas untuk pertanyaan santai, mendalam untuk pertanyaan teknis, dan selalu menawarkan kelanjutan percakapan interaktif (*conversational inquiry*).
3. **Resilient**: Tahan typo, bahasa gaul, pesan panjang, serta memiliki fallback instan jika API eksternal mengalami kendala jaringan.
4. **Cepat & Andal**: Latensi respon di bawah 1,5 detik untuk interaksi real-time di antarmuka publik.

---

## 2. Rincian Task List Pengembangan & Pengujian

### FASE 1: Core Engine & Resiliensi (Selesai)
- [x] **T-AI-01: Integrasi Google Gemini API Generative Model**
  - Implementasi fallback berjenjang: `gemini-3.5-flash` -> `gemini-3.1-flash-lite` -> `gemini-3.7-flash` -> `Local Adaptive Engine`.
  - Konfigurasi `system_instruction` dengan strict business grounding.
- [x] **T-AI-02: Conversational Pacing & Dynamic Depth Handling**
  - Pertanyaan kasual dijawab ringkas (2-3 paragraf) disertai penawaran eksplorasi kelanjutan.
  - Penambahan tag ekstraksi follow-up otomatis `[FOLLOW_UPS: A | B | C]`.
  - Normalisasi typo umum ("ornava" -> "orvana") dan de-duplikasi karakter berulang ("halooo" -> "halo").
- [x] **T-AI-03: Peningkatan UI Chatbot & Markdown Formatter**
  - Render format **bold** (`**kata**`), italic, dan *bullet list* secara sempurna di dalam bubble chat.
  - Avatar resmi robot AI modern dengan badge status *Official AI*.
  - Sisi user tanpa avatar untuk menjaga kebersihan visual landing page.

---

### FASE 2: Pengujian Otomatis & Verifikasi Logika (Sedang Berjalan)
- [ ] **T-AI-04: Test Suite Otomatis Backend (`test/chatbot.e2e-spec.ts` & unit test)**
  - [ ] **TC-01 (Kueri Dasar & Sapaan)**: Memverifikasi sapaan santai ("halo bro", "pagi gan") dibalas ramah tanpa error.
  - [ ] **TC-02 (Toleransi Typo)**: Memverifikasi kueri dengan typo ("ornava", "brapaa kuotanyaa") tetap dipahami tepat sasaran.
  - [ ] **TC-03 (Uji Grounding Kuota 60%)**: Memverifikasi AI menyebutkan angka persis minimal 60% kuota lokal dan maksimal 40% distributor luar.
  - [ ] **TC-04 (Uji Two-Stage Escrow)**: Memverifikasi AI menjelaskan DP 30% di awal dan Pelunasan 70% cair dalam <= 24 jam setelah lulus QC.
  - [ ] **TC-05 (Uji Multi-turn History)**: Memverifikasi kelanjutan konteks (misal: "jelasin lebih dalam" setelah pengenalan ORVANA).
  - [ ] **TC-06 (Uji Resiliensi Fallback)**: Memverifikasi jika Gemini API disimulasikan offline, backend otomatis menyajikan respons lokal tanpa status HTTP 500.

---

### FASE 3: Pengujian Persona, Gaya Bahasa & Evaluasi Pengguna (Akan Datang)
- [ ] **T-AI-05: Blind Test & Variasi Persona (Tone Matching)**
  - Menguji 5 gaya bahasa input:
    1. *Gaya Santai/Gen-Z*: "bro ini ornava apaan dah, jelasin singkat dong" -> Respon santai, analogis, dan ringkas.
    2. *Gaya Pejabat/Dinas*: "Mohon penjelasan terkait mekanisme kepatuhan kuota serapan lokal 60 persen" -> Respon formal, data regulasi, dan akuntabel.
    3. *Gaya Petani*: "Saya petani cabe di desa, gimana cara jual hasil panen kesini dan kapan uangnya cair?" -> Respon hangat, jelas soal DP 30% dan bantuan koordinator.
    4. *Gaya Auditor/Inspektur*: "Bagaimana rantai pasok ini membuktikan integritas catatan kas dan sertifikat batch?" -> Respon berfokus pada ledger append-only dan QR paspor mutu.
    5. *Pertanyaan Out-of-Scope*: "Rekomendasikan resep masakan luar negeri untuk makan malam" -> Menolak halus dan mengarahkan kembali ke ekosistem pangan lokal ORVANA.

---

### FASE 4: Kinerja, Latensi & Skalabilitas (Akan Datang)
- [ ] **T-AI-06: Benchmark Latensi & Optimasi Token**
  - Mengukur *Time to First Token (TTFT)* dan *Total Response Time* (<= 1.200 ms).
  - Pengoptimalan jumlah token maksimum (`maxOutputTokens: 2048`) dan kompresi konteks riwayat percakapan.
  - Penambahan rate limiting khusus kueri publik chatbot (anti-spam DDoS).
- [ ] **T-AI-07: Automated UI E2E Test (Playwright / Vitest)**
  - Pengujian alur interaksi pengguna di peramban: klik floating button -> ketik pesan -> terima jawaban -> klik chip saran follow-up -> verifikasi bubble baru muncul otomatis.

---

## 3. Vektor Uji Kritis (Acceptance Criteria Matrix)

| ID | Kasus Uji | Input Contoh | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| **V-01** | Sapaan Santai | "halo bro selamat siang" | Menyapa hangat, ramah, menawarkan bantuan ringkas. | PASS |
| **V-02** | Typo Ekstrem | "apa sih keunggulan ornavaaa dibanding yg lain?" | Mengenali ORVANA, menjelaskan peran jembatan dapur & petani lokal. | PASS |
| **V-03** | Pertanyaan Singkat | "apa itu orvana?" | Jawaban ringkas 2-3 paragraf + bertanya apakah ingin rincian lebih lanjut. | PASS |
| **V-04** | Regulasi Kuota | "kenapa harus 60%?" | Menyebut angka 60% serapan lokal radius terdekat demi kedaulatan pangan. | PASS |
| **V-05** | Skema Keuangan | "kapan petani nerima uang?" | Menyebutkan DP 30% saat PO dan 70% pelunasan setelah lolos QC. | PASS |
| **V-06** | Penelusuran Publik | "cara cek batch dari mana?" | Menjelaskan pemindaian QR code atau membuka `/trace/:batchCode`. | PASS |
| **V-07** | Markdown Formatting | Teks berformat `**bold**` | Di-render dengan tag tebal `<strong>`, tidak ada tanda `**` mentah di layar. | PASS |
| **V-08** | Offline Fallback | Simulasi network blackout | Menjawab menggunakan `Adaptive Neural Fallback`, status HTTP tetap 200. | PASS |
