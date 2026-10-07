import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatRupiah, formatKg } from '../../lib/format';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import {
  BookOpen,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  QrCode,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Award,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface Interactive3dLedgerBookProps {
  impact: {
    localSpendingRupiah: number;
    producersInvolved: number;
    totalDeliveredKg: number;
    qualityPassRatePct: number;
    avgDistanceKm: number;
  } | undefined;
  isLoading: boolean;
}

// 0: Hardcover Cover Depan
// 1: Spread 1 (Halaman 1 & 2 - Kas Keuangan & Produsen Lokal)
// 2: Spread 2 (Halaman 3 & 4 - Logistik Panen & Inspeksi Mutu Gizi)
// 3: Spread 3 (Halaman 5 & 6 - Paspor QR Code & Sertifikat Audit Publik)
export const Interactive3dLedgerBook: React.FC<Interactive3dLedgerBookProps> = ({
  impact,
  isLoading,
}) => {
  const [currentSpread, setCurrentSpread] = useState<number>(1); // Default open on Spread 1
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const touchStartXRef = useRef<number | null>(null);

  const totalSpreads = 3; // 0 (Cover), 1, 2, 3

  const goToNext = () => {
    if (isFlipping) return;
    if (currentSpread < totalSpreads) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev + 1);
        setIsFlipping(false);
      }, 420);
    }
  };

  const goToPrev = () => {
    if (isFlipping) return;
    if (currentSpread > 0) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev - 1);
        setIsFlipping(false);
      }, 420);
    }
  };

  // Touch & Swipe handlers for mobile swipe left / right
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartXRef.current - touchEndX;

    if (diffX > 45) {
      // Swiped left -> Next page
      goToNext();
    } else if (diffX < -45) {
      // Swiped right -> Previous page
      goToPrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <div className="relative select-none">
      {/* Top Ledger Ribbon Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Ribbon Bookmark Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              if (!isFlipping && currentSpread !== 0) {
                setFlipDirection('prev');
                setIsFlipping(true);
                setTimeout(() => {
                  setCurrentSpread(0);
                  setIsFlipping(false);
                }, 380);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              currentSpread === 0
                ? 'bg-stone-900 text-amber-300 border-stone-800 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            📕 Sampul
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isFlipping && currentSpread !== 1) {
                setFlipDirection(currentSpread > 1 ? 'prev' : 'next');
                setIsFlipping(true);
                setTimeout(() => {
                  setCurrentSpread(1);
                  setIsFlipping(false);
                }, 380);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              currentSpread === 1
                ? 'bg-emerald-950 text-emerald-300 border-emerald-900 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-emerald-50'
            }`}
          >
            💰 Lembar Kas
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isFlipping && currentSpread !== 2) {
                setFlipDirection(currentSpread > 2 ? 'prev' : 'next');
                setIsFlipping(true);
                setTimeout(() => {
                  setCurrentSpread(2);
                  setIsFlipping(false);
                }, 380);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              currentSpread === 2
                ? 'bg-emerald-950 text-emerald-300 border-emerald-900 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-emerald-50'
            }`}
          >
            🥦 Mutu & Pangan
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isFlipping && currentSpread !== 3) {
                setFlipDirection('next');
                setIsFlipping(true);
                setTimeout(() => {
                  setCurrentSpread(3);
                  setIsFlipping(false);
                }, 380);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              currentSpread === 3
                ? 'bg-emerald-950 text-emerald-300 border-emerald-900 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-emerald-50'
            }`}
          >
            🔍 Audit & QR
          </button>
        </div>

        {/* Flipping Page Buttons & Gestures Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="hidden sm:inline text-stone-600 text-[11px]">
            Usap layar atau klik panah untuk membalik:
          </span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentSpread === 0 || isFlipping}
              className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800"
              title="Lembar Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-[11px] font-bold text-stone-700">
              {currentSpread === 0 ? 'Tutup' : `Lembar ${currentSpread}/3`}
            </span>

            <button
              type="button"
              onClick={goToNext}
              disabled={currentSpread === totalSpreads || isFlipping}
              className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800"
              title="Lembar Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D BOOK STAGE CONTAINER WITH PERSPECTIVE */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative [perspective:1400px] transition-all duration-500"
      >
        {/* Book Outer Leather Casing & Depth Shadow */}
        <div
          className={`relative rounded-3xl transition-all duration-500 shadow-2xl overflow-hidden border border-[#D5CBBB] ${
            currentSpread === 0
              ? 'max-w-xl mx-auto bg-[#13251E] p-4 sm:p-6 border-emerald-900/60'
              : 'bg-[#EDE7DD] p-3 sm:p-5'
          }`}
        >
          {/* Top Decorative Bookmark Silk Ribbon */}
          {currentSpread !== 0 && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
              <div className="w-8 h-12 bg-gradient-to-b from-amber-600 via-amber-500 to-amber-700 shadow-md flex items-end justify-center pb-1">
                <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[8px] border-b-[#F8F5EE]" />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW A: HARDCOVER SAMPUL DEPAN (SAAT BUKU DITUTUP) */}
          {/* ======================================================== */}
          {currentSpread === 0 ? (
            <div className="rounded-2xl bg-gradient-to-br from-[#1E3A2F] via-[#162C24] to-[#0D1C16] border-2 border-[#E6C364]/70 p-8 sm:p-12 text-center text-white relative shadow-inner overflow-hidden">
              {/* Gold Filigree Corner Borders */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#E6C364]/80 pointer-events-none" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#E6C364]/80 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#E6C364]/80 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#E6C364]/80 pointer-events-none" />

              {/* Book Spine Stitch Texture Effect on Left */}
              <div className="absolute left-0 inset-y-0 w-4 bg-black/40 border-r border-[#E6C364]/30" />

              <div className="max-w-md mx-auto space-y-5 relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E6C364]/10 border border-[#E6C364]/40 shadow-inner">
                  <Award className="w-8 h-8 text-[#E6C364]" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono tracking-widest text-[#E6C364] uppercase block font-bold">
                    REPUBLIK INDONESIA • DINAS TERKAIT
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50 tracking-tight">
                    BUKU BESAR RANTAI PASOK
                  </h3>
                  <p className="text-xs font-mono text-emerald-200/80">
                    Catatan Arus Keuangan & Distribusi Dapur Gizi Massal
                  </p>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#E6C364]/50 to-transparent my-4" />

                <div className="p-3.5 rounded-xl bg-black/25 border border-white/10 text-xs font-mono text-emerald-100/90 space-y-1">
                  <div className="flex justify-between">
                    <span>Sifat Dokumen:</span>
                    <strong className="text-amber-300">Terbuka untuk Umum (Publik)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Integritas Data:</span>
                    <strong className="text-emerald-400">Append-Only (Anti-Manipulasi)</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setFlipDirection('next');
                      setIsFlipping(true);
                      setTimeout(() => {
                        setCurrentSpread(1);
                        setIsFlipping(false);
                      }, 400);
                    }}
                    className="w-full sm:w-auto bg-[#E6C364] hover:bg-[#D4B052] text-stone-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Buka Lembaran Buku</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW B: LEMBAR HALAMAN TERBUKA DENGAN FLIP EFFECT 3D */
            /* ======================================================== */
            <div
              className={`relative rounded-2xl bg-[#F8F5EE] border border-[#DDD5C5] shadow-2xl overflow-hidden transition-all duration-400 ${
                isFlipping
                  ? flipDirection === 'next'
                    ? '[transform:rotateY(-6deg)_scale(0.985)] opacity-85'
                    : '[transform:rotateY(6deg)_scale(0.985)] opacity-85'
                  : '[transform:rotateY(0deg)_scale(1)] opacity-100'
              }`}
            >
              {/* Subtle Parchment Page Grain Texture */}
              <div className="absolute inset-0 bg-[radial-gradient(#5C4033_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-[0.025] pointer-events-none" />

              {/* Central Spine Fold Shadow on Desktop */}
              <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-stone-400/20 via-stone-500/35 to-stone-400/20 z-20 pointer-events-none shadow-inner" />
              <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-stone-300 z-25 pointer-events-none" />

              {/* TWO PAGE SPREAD CONTENT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-300/80 relative z-10">
                {/* ---------------------------------------------------- */}
                {/* SPREAD 1: KEUANGAN KAS DESA & MITRA PRODUSEN         */}
                {/* ---------------------------------------------------- */}
                {currentSpread === 1 && (
                  <>
                    {/* HALAMAN 1 (KIRI) */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-r from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative">
                      <div>
                        {/* Page Header */}
                        <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3.5 mb-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-stone-600 uppercase tracking-widest">
                              <span>LEMBAR KAS #01</span>
                              <span>•</span>
                              <span>NERACA BELANJA DAERAH</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                              Arus Kas Masuk Petani Lokal
                            </h3>
                          </div>

                          {/* Wax Seal Stamp */}
                          <div className="border-2 border-emerald-700/60 rounded-xl px-2 py-0.5 rotate-[-3deg] bg-emerald-50/80 shadow-2xs">
                            <span className="text-[9px] font-serif font-black text-emerald-800 flex items-center gap-0.5">
                              <Check className="w-3 h-3 text-emerald-700" />
                              AUDIT SAH
                            </span>
                          </div>
                        </div>

                        {/* Large Metric: Perputaran Belanja */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/85 border border-emerald-200/90 shadow-2xs space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-900">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                              Total Kas Dibelanjakan ke Petani
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
                              100% Hak Daerah
                            </span>
                          </div>

                          <div className="text-2xl sm:text-4xl font-serif font-bold text-emerald-950 tracking-tight">
                            {isLoading ? (
                              <Skeleton className="h-9 w-40" />
                            ) : (
                              formatRupiah(impact?.localSpendingRupiah || 0)
                            )}
                          </div>

                          <p className="text-[11px] text-stone-600 font-sans leading-relaxed pt-1 border-t border-stone-200/60">
                            Seluruh pembayaran cair langsung ke rekening petani/nelayan begitu bahan lolos uji mutu dapur dinas.
                          </p>
                        </div>

                        {/* Mini Ledger Ledger Table Rows */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-stone-600 uppercase block">
                            Status Alokasi Dana Kas:
                          </span>
                          <div className="p-2.5 rounded-xl bg-white/60 border border-stone-200 text-xs font-mono space-y-1.5">
                            <div className="flex justify-between text-stone-700">
                              <span>Perantara / Makelar:</span>
                              <strong className="text-emerald-700">Rp 0 (Tanpa Calo)</strong>
                            </div>
                            <div className="flex justify-between text-stone-700">
                              <span>Skema Pencairan:</span>
                              <strong className="text-emerald-800">Escrow Aman Real-time</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Halaman 1 */}
                      <div className="pt-4 mt-6 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-600">
                        <span>Pencatatan: Real-time Append-Only</span>
                        <span>Halaman 1 dari 6</span>
                      </div>
                    </div>

                    {/* HALAMAN 2 (KANAN) */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-l from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative">
                      <div>
                        {/* Page Header */}
                        <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3.5 mb-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-stone-600 uppercase tracking-widest">
                              <span>LEMBAR KAS #02</span>
                              <span>•</span>
                              <span>MITRA PRODUSEN DESA</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                              Rincian Produsen Terlibat
                            </h3>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                            {impact?.producersInvolved || 5} Kelompok Aktif
                          </span>
                        </div>

                        {/* Producer Highlight Card */}
                        <div className="space-y-2.5 mb-4">
                          {[
                            { name: 'Poktan Makmur Subur', komoditas: 'Beras & Sayur', desa: 'Desa Sukamaju' },
                            { name: 'Koperasi Mina Bahari', komoditas: 'Ikan Lele & Nila', desa: 'Pesisir Citarum' },
                            { name: 'Ternak Unggas Berkah', komoditas: 'Telur Segar', desa: 'Kec. Parung' },
                          ].map((prod, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-3 rounded-xl bg-white/80 border border-stone-200 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] flex items-center justify-center">
                                  #{pIdx + 1}
                                </span>
                                <div>
                                  <h4 className="font-bold text-stone-900 font-sans">{prod.name}</h4>
                                  <span className="text-[10px] text-stone-600 font-mono">{prod.desa}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {prod.komoditas}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Page Dog-Ear Turn Hint */}
                        <button
                          type="button"
                          onClick={goToNext}
                          className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-amber-900 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>Buka Lembar 2: Logistik & Mutu Gizi</span>
                          <span className="flex items-center gap-1">
                            <span>Balik Halaman</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      </div>

                      {/* Footer Halaman 2 */}
                      <div className="pt-4 mt-6 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-600">
                        <span className="text-emerald-800 font-bold">● Akses Publik Terbuka</span>
                        <span>Halaman 2 dari 6</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ---------------------------------------------------- */}
                {/* SPREAD 2: LOGISTIK PANEN & KONTROL MUTU GIZI         */}
                {/* ---------------------------------------------------- */}
                {currentSpread === 2 && (
                  <>
                    {/* HALAMAN 3 (KIRI) */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-r from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative">
                      <div>
                        {/* Page Header */}
                        <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3.5 mb-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-stone-600 uppercase tracking-widest">
                              <span>LEMBAR LOGISTIK #03</span>
                              <span>•</span>
                              <span>VOLUME TIMBANGAN</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                              Total Pangan Bergizi Tersalurkan
                            </h3>
                          </div>

                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Large Metric: Volume Timbangan */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/85 border border-amber-200/90 shadow-2xs space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-900">
                            <span>Volume Berat Bersih Lolos Timbang</span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                              Pangan Segar
                            </span>
                          </div>

                          <div className="text-2xl sm:text-4xl font-mono font-bold text-stone-950 tracking-tight">
                            {isLoading ? (
                              <Skeleton className="h-9 w-36" />
                            ) : (
                              formatKg(impact?.totalDeliveredKg || 0)
                            )}
                          </div>

                          <p className="text-[11px] text-stone-600 font-sans leading-relaxed pt-1 border-t border-stone-200/60">
                            Beras lokal, ikan air tawar, sayur hijau, dan telur ayam langsung tiba di dapur dalam kondisi prima.
                          </p>
                        </div>

                        {/* Radius Pengiriman & Emisi Karbon */}
                        <div className="p-3.5 rounded-xl bg-white/70 border border-stone-200 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
                            <div>
                              <span className="text-[10px] font-mono font-bold text-stone-600 block uppercase">
                                Radius Rata-rata Ladang ke Dapur
                              </span>
                              <strong className="text-sm font-mono text-stone-900 font-extrabold">
                                {isLoading ? <Skeleton className="h-4 w-16" /> : `${impact?.avgDistanceKm || 0} km`}
                              </strong>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Jejak Karbon Sangat Rendah
                          </span>
                        </div>
                      </div>

                      {/* Footer Halaman 3 */}
                      <div className="pt-4 mt-6 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-600">
                        <span>Verifikasi Timbangan: Digital Scale</span>
                        <span>Halaman 3 dari 6</span>
                      </div>
                    </div>

                    {/* HALAMAN 4 (KANAN) */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-l from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative">
                      <div>
                        {/* Page Header */}
                        <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3.5 mb-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-stone-600 uppercase tracking-widest">
                              <span>LEMBAR MUTU #04</span>
                              <span>•</span>
                              <span>STANDAR KESEHATAN GIZI</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                              Laporan Inspeksi Ahli Gizi
                            </h3>
                          </div>

                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        </div>

                        {/* QC Pass Rate Highlight */}
                        <div className="p-4 rounded-2xl bg-white/80 border border-purple-200 shadow-2xs space-y-2 mb-3.5">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-900">
                            <span>Tingkat Kelulusan Uji Mutu (QC)</span>
                            <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">
                              Inspeksi Ketat
                            </span>
                          </div>

                          <div className="text-2xl sm:text-3xl font-mono font-bold text-purple-950">
                            {isLoading ? (
                              <Skeleton className="h-8 w-24" />
                            ) : (
                              `${impact?.qualityPassRatePct || 0}%`
                            )}
                          </div>

                          <p className="text-[11px] text-stone-600 font-sans leading-relaxed pt-1 border-t border-stone-200/60">
                            Bahan yang tidak memenuhi standar kesegaran & kebersihan langsung ditolak demi kesehatan santri/anak sekolah.
                          </p>
                        </div>

                        {/* Interactive Page Dog-Ear Turn Hint */}
                        <button
                          type="button"
                          onClick={goToNext}
                          className="w-full p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-950 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>Buka Lembar 3: Paspor QR & Audit Sah</span>
                          <span className="flex items-center gap-1">
                            <span>Balik Halaman</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      </div>

                      {/* Footer Halaman 4 */}
                      <div className="pt-4 mt-6 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-600">
                        <span className="text-purple-800 font-bold">● Standar Dinkes Terpenuhi</span>
                        <span>Halaman 4 dari 6</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ---------------------------------------------------- */}
                {/* SPREAD 3: PASPOR QR CODE & SERTIFIKAT AUDIT PUBLIK   */}
                {/* ---------------------------------------------------- */}
                {currentSpread === 3 && (
                  <>
                    {/* HALAMAN 5 (KIRI) */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-r from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative">
                      <div>
                        {/* Page Header */}
                        <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3.5 mb-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-stone-600 uppercase tracking-widest">
                              <span>LEMBAR JEJAK #05</span>
                              <span>•</span>
                              <span>PASPOR BATCH DIGITAL</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                              Ketertelusuran Asal Makanan
                            </h3>
                          </div>

                          <QrCode className="w-6 h-6 text-emerald-850" />
                        </div>

                        {/* Simulated QR Code Passport Pass */}
                        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-stone-900 rounded-xl p-1.5 flex items-center justify-center shrink-0">
                              <QrCode className="w-full h-full text-white" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-emerald-850 uppercase block">
                                Paspor Pangan Resmi
                              </span>
                              <h4 className="text-xs font-bold text-stone-900 font-mono">
                                BATCH-2026-X781-SUKAMUR
                              </h4>
                              <p className="text-[11px] text-stone-600 mt-0.5">
                                Dapat dipindai orang tua murid & auditor publik
                              </p>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] font-mono space-y-1 text-stone-700">
                            <div className="flex justify-between">
                              <span>Asal Panen:</span>
                              <strong>Kebun Pak Joko, Desa Cisarua</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Kurir Angkut:</span>
                              <strong>Pengepul Koordinator Unit A</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Uji Ahli Gizi:</span>
                              <strong className="text-emerald-700">Grade A (Lulus Segar)</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Halaman 5 */}
                      <div className="pt-4 mt-6 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-600">
                        <span>Transparansi 100% dari Ladang</span>
                        <span>Halaman 5 dari 6</span>
                      </div>
                    </div>

                    {/* HALAMAN 6 (KANAN) */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-l from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative">
                      <div>
                        {/* Page Header */}
                        <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3.5 mb-5">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-stone-600 uppercase tracking-widest">
                              <span>LEMBAR INTEGRITAS #06</span>
                              <span>•</span>
                              <span>AKUNTABILITAS NEGARA</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                              Sertifikat Audit Terbuka
                            </h3>
                          </div>

                          <FileCheck className="w-6 h-6 text-emerald-800" />
                        </div>

                        {/* Certificate Stamp & Guarantee Box */}
                        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs space-y-3 mb-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 text-[11px] font-mono font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>JAMINAN ANTI-MARKUP PEMDA</span>
                          </div>

                          <p className="text-xs text-stone-700 leading-relaxed font-sans">
                            Setiap data yang tercatat dalam buku besar ini bersifat <strong>permanen (append-only)</strong> dan tidak dapat disunting manual untuk mencegah korupsi atau manipulasi laporan.
                          </p>

                          <div className="pt-1">
                            <Link to="/auditor/dashboard" className="block">
                              <Button
                                size="sm"
                                className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Buka Seluruh Buku Kas (Portal Auditor)</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Reset to Cover Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setFlipDirection('prev');
                            setIsFlipping(true);
                            setTimeout(() => {
                              setCurrentSpread(0);
                              setIsFlipping(false);
                            }, 400);
                          }}
                          className="w-full p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Tutup Buku & Kembali ke Sampul Depan</span>
                        </button>
                      </div>

                      {/* Footer Halaman 6 */}
                      <div className="pt-4 mt-6 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-600">
                        <span className="text-emerald-800 font-bold">● Buku Lengkap & Selesai</span>
                        <span>Halaman 6 dari 6</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Book Bottom Page Edges Simulation (Stacked Pages Effect) */}
          {currentSpread !== 0 && (
            <>
              <div className="h-2.5 mx-3 bg-[#E2DAC9] rounded-b-xl border-x border-b border-[#D0C5B0] shadow-2xs" />
              <div className="h-1 mx-6 bg-[#D8CEBA] rounded-b-lg border-x border-b border-[#C4B79E]" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
