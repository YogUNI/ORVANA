import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatRupiah, formatKg } from '../../lib/format';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import {
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
  ArrowRight,
  Hand,
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

export const Interactive3dLedgerBook: React.FC<Interactive3dLedgerBookProps> = ({
  impact,
  isLoading,
}) => {
  // 0: Lembar 1 & 2
  // 1: Lembar 3 & 4
  // 2: Lembar 5 & 6
  const [spread, setSpread] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDir, setFlipDir] = useState<'next' | 'prev' | null>(null);
  const [flipAngle, setFlipAngle] = useState<number>(0);
  const totalSpreads = 3;

  const triggerNext = () => {
    if (isFlipping || spread >= totalSpreads - 1) return;
    setFlipDir('next');
    setIsFlipping(true);
    setFlipAngle(0);

    requestAnimationFrame(() => {
      setFlipAngle(-180);
    });

    setTimeout(() => {
      setSpread((prev) => prev + 1);
      setIsFlipping(false);
      setFlipDir(null);
      setFlipAngle(0);
    }, 700);
  };

  const triggerPrev = () => {
    if (isFlipping || spread <= 0) return;
    setFlipDir('prev');
    setIsFlipping(true);
    setFlipAngle(-180);

    requestAnimationFrame(() => {
      setFlipAngle(0);
    });

    setTimeout(() => {
      setSpread((prev) => prev - 1);
      setIsFlipping(false);
      setFlipDir(null);
      setFlipAngle(0);
    }, 700);
  };

  // Touch swipe support
  const touchStartRef = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (diff > 45) triggerNext();
    else if (diff < -45) triggerPrev();
    touchStartRef.current = null;
  };

  // Content of left pages (hal 1, 3, 5)
  const renderLeft = (idx: number) => {
    if (idx === 0) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-[#D1C7B7] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#786C58] uppercase tracking-widest block">
                  LEMBAR #01 • KEUANGAN DESA
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2A241A] mt-0.5">
                  Arus Kas Petani & Nelayan
                </h3>
              </div>
              <div className="border border-emerald-800/70 rounded-lg px-2 py-0.5 rotate-[-2deg] bg-[#E8F3EB] shadow-2xs">
                <span className="text-[9px] font-serif font-black text-emerald-900 flex items-center gap-0.5">
                  <Check className="w-3 h-3 text-emerald-700" />
                  AUDIT SAH
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9]/95 border border-[#D5CCBA] shadow-2xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-950">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  Total Kas Belanja Langsung
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                  100% Hak Petani
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950">
                {isLoading ? <Skeleton className="h-8 w-36" /> : formatRupiah(impact?.localSpendingRupiah || 0)}
              </div>
              <p className="text-[11px] text-[#5C5242] font-sans leading-relaxed pt-1 border-t border-[#E5DEC9]">
                Dana dibayarkan langsung tanpa potongan calo begitu bahan lolos uji mutu dapur dinas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FFFDF9]/80 border border-[#D5CCBA] text-xs font-mono space-y-1">
              <div className="flex justify-between text-[#4A4031]">
                <span>Potongan Calo:</span>
                <strong className="text-emerald-800">Rp 0 (Tanpa Makelar)</strong>
              </div>
              <div className="flex justify-between text-[#4A4031]">
                <span>Status Rekening:</span>
                <strong className="text-emerald-800">Cair Bersih ke Desa</strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D1C7B7] flex items-center justify-between text-[10px] font-mono text-[#786C58]">
            <span>Append-Only Ledger</span>
            <span>Halaman 1 dari 6</span>
          </div>
        </div>
      );
    } else if (idx === 1) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-[#D1C7B7] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#786C58] uppercase tracking-widest block">
                  LEMBAR #03 • TIMBANGAN PANEN
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2A241A] mt-0.5">
                  Volume Pangan Bergizi
                </h3>
              </div>
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9]/95 border border-[#D5CCBA] shadow-2xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-950">
                <span>Berat Bersih Lolos Timbang</span>
                <span className="text-[9px] bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                  Segar Bergizi
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-stone-950">
                {isLoading ? <Skeleton className="h-8 w-32" /> : formatKg(impact?.totalDeliveredKg || 0)}
              </div>
              <p className="text-[11px] text-[#5C5242] font-sans leading-relaxed pt-1 border-t border-[#E5DEC9]">
                Beras, lele segar, telur ayam, dan sayuran hijau lokal yang telah diserap dapur.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FFFDF9]/80 border border-[#D5CCBA] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <div>
                  <span className="text-[9px] font-mono text-[#786C58] block uppercase">Radius Pengiriman</span>
                  <strong className="font-mono text-[#2A241A]">{impact?.avgDistanceKm || 0} km</strong>
                </div>
              </div>
              <span className="text-[9px] font-mono text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                Emisi Rendah
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D1C7B7] flex items-center justify-between text-[10px] font-mono text-[#786C58]">
            <span>Timbangan Digital Terhubung</span>
            <span>Halaman 3 dari 6</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-[#D1C7B7] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#786C58] uppercase tracking-widest block">
                  LEMBAR #05 • PASPOR PANEN
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2A241A] mt-0.5">
                  Lacak Asal Makanan QR
                </h3>
              </div>
              <QrCode className="w-5 h-5 text-emerald-850" />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5CCBA] shadow-2xs space-y-2.5 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 bg-stone-900 rounded-lg p-1 flex items-center justify-center shrink-0">
                  <QrCode className="w-full h-full text-white" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-850 uppercase block">
                    Paspor Digital Publik
                  </span>
                  <h4 className="text-xs font-bold text-stone-900 font-mono">
                    BATCH-2026-X781
                  </h4>
                </div>
              </div>
              <div className="p-2 rounded bg-[#F7F2E7] text-[10px] font-mono space-y-1 text-stone-700 border border-[#DDD3BF]">
                <div className="flex justify-between">
                  <span>Asal Kebun:</span>
                  <strong>Poktan Makmur Subur</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kurir Angkut:</span>
                  <strong>Unit Logistik B</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D1C7B7] flex items-center justify-between text-[10px] font-mono text-[#786C58]">
            <span>Transparansi 100% Publik</span>
            <span>Halaman 5 dari 6</span>
          </div>
        </div>
      );
    }
  };

  // Content of right pages (hal 2, 4, 6)
  const renderRight = (idx: number) => {
    if (idx === 0) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-[#D1C7B7] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#786C58] uppercase tracking-widest block">
                  LEMBAR #02 • MITRA DAERAH
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2A241A] mt-0.5">
                  Mitra Produsen Desa
                </h3>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {impact?.producersInvolved || 5} Kelompok Tani
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {[
                { name: 'Poktan Makmur Subur', komoditas: 'Beras & Sayur', desa: 'Desa Sukamaju' },
                { name: 'Koperasi Mina Bahari', komoditas: 'Ikan Lele & Nila', desa: 'Pesisir Citarum' },
                { name: 'Ternak Unggas Berkah', komoditas: 'Telur Ayam Segar', desa: 'Kec. Parung' },
              ].map((prod, pIdx) => (
                <div key={pIdx} className="p-2.5 rounded-xl bg-[#FFFDF9]/90 border border-[#D5CCBA] flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-[#2A241A]">{prod.name}</h4>
                    <span className="text-[10px] text-[#786C58] font-mono">{prod.desa}</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {prod.komoditas}
                  </span>
                </div>
              ))}
            </div>

            {/* Turn Page Button / Corner Fold */}
            <button
              type="button"
              onClick={triggerNext}
              className="w-full p-2.5 rounded-xl bg-[#F6EEDF] hover:bg-[#EFE3CF] border border-[#DDD1BE] text-amber-950 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
            >
              <span className="flex items-center gap-1.5">
                <Hand className="w-3.5 h-3.5 text-amber-800 group-hover:translate-x-1 transition-transform" />
                <span>Balik Lembar ke Mutu Gizi</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-3 border-t border-[#D1C7B7] flex items-center justify-between text-[10px] font-mono text-[#786C58]">
            <span className="text-emerald-900 font-bold">● Akses Publik Bebas</span>
            <span>Halaman 2 dari 6</span>
          </div>
        </div>
      );
    } else if (idx === 1) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-[#D1C7B7] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#786C58] uppercase tracking-widest block">
                  LEMBAR #04 • INSPEKSI MUTU GIZI
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2A241A] mt-0.5">
                  Laporan Ahli Gizi (QC)
                </h3>
              </div>
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9]/95 border border-[#D5CCBA] shadow-2xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-950">
                <span>Tingkat Kelulusan Mutu QC</span>
                <span className="text-[9px] bg-purple-100 text-purple-950 px-2 py-0.5 rounded-full border border-purple-300">
                  Uji Ketat
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-purple-950">
                {isLoading ? <Skeleton className="h-8 w-20" /> : `${impact?.qualityPassRatePct || 0}%`}
              </div>
              <p className="text-[11px] text-[#5C5242] font-sans leading-relaxed pt-1 border-t border-[#E5DEC9]">
                Bahan yang busuk atau tidak segar langsung ditolak sistem demi kesehatan gizi anak-anak penerima makanan.
              </p>
            </div>

            <button
              type="button"
              onClick={triggerNext}
              className="w-full p-2.5 rounded-xl bg-[#F4EEF8] hover:bg-[#E9DFEF] border border-[#DDD0E6] text-purple-950 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
            >
              <span className="flex items-center gap-1.5">
                <Hand className="w-3.5 h-3.5 text-purple-800 group-hover:translate-x-1 transition-transform" />
                <span>Balik Lembar ke Paspor QR</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-3 border-t border-[#D1C7B7] flex items-center justify-between text-[10px] font-mono text-[#786C58]">
            <span className="text-purple-900 font-bold">● Standar Dinkes</span>
            <span>Halaman 4 dari 6</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-[#D1C7B7] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#786C58] uppercase tracking-widest block">
                  LEMBAR #06 • AUDIT PUBLIK
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2A241A] mt-0.5">
                  Sertifikat Akuntabilitas
                </h3>
              </div>
              <FileCheck className="w-5 h-5 text-emerald-800" />
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9]/95 border border-[#D5CCBA] shadow-2xs space-y-2.5 mb-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 text-[10px] font-mono font-bold border border-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>ANTI-MARKUP ANGGARAN</span>
              </div>
              <p className="text-xs text-[#5C5242] leading-relaxed font-sans">
                Setiap transaksi bersifat permanen dan tidak bisa direkayasa secara manual.
              </p>
              <div className="pt-1">
                <Link to="/auditor/dashboard" className="block">
                  <Button size="sm" className="w-full bg-[#1A3328] hover:bg-[#12241C] text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Buka Seluruh Buku Kas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D1C7B7] flex items-center justify-between text-[10px] font-mono text-[#786C58]">
            <span className="text-emerald-900 font-bold">● Buku Lengkap</span>
            <span>Halaman 6 dari 6</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      
      {/* Top Ledger Controller */}
      <div className="flex items-center justify-between gap-2 mb-4 px-2">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-600">
          <Hand className="w-4 h-4 text-emerald-700 animate-pulse" />
          <span className="hidden sm:inline">Usap layar atau klik tombol panah untuk membalik lembaran kertas</span>
          <span className="sm:hidden">Usap untuk membalik lembar</span>
        </div>

        {/* Turn Buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs text-xs font-mono">
          <button
            type="button"
            onClick={triggerPrev}
            disabled={spread === 0 || isFlipping}
            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800 cursor-pointer"
            title="Balik ke Lembar Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-bold text-stone-800 text-[11px]">
            Lembar {spread + 1} dari {totalSpreads}
          </span>
          <button
            type="button"
            onClick={triggerNext}
            disabled={spread >= totalSpreads - 1 || isFlipping}
            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800 cursor-pointer"
            title="Balik ke Lembar Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* REALISTIC 3D HARDCOVER OPEN BOOK CONTAINER               */}
      {/* ======================================================== */}
      <div className="relative p-2 sm:p-5">
        
        {/* Real Hardcover Outer Edge & Heavy Drop Shadow on Desk */}
        <div
          style={{
            boxShadow: '0 25px 50px -12px rgba(28, 20, 10, 0.35), 0 10px 20px -5px rgba(28, 20, 10, 0.25)',
          }}
          className="relative rounded-[28px] bg-[#2E2015] p-3 sm:p-4 border-2 border-[#4A3525]"
        >
          {/* Gold Embossed Leather Stitch Border */}
          <div className="absolute inset-2 sm:inset-3 rounded-[22px] border border-[#C5A059]/40 pointer-events-none" />

          {/* Book White/Ivory Block Pages (Paper Stack Layers) */}
          <div className="relative rounded-2xl bg-[#EFE9DC] border border-[#C9BFA9] overflow-hidden shadow-inner">
            
            {/* Top Red-Gold Silk Bookmark Ribbon Dropping Down */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
              <div className="w-7 sm:w-8 h-12 bg-gradient-to-b from-[#B91C1C] via-[#DC2626] to-[#991B1B] shadow-md flex items-end justify-center pb-1 border-x border-[#7F1D1D]">
                <div className="w-0 h-0 border-l-[14px] sm:border-l-[16px] border-l-transparent border-r-[14px] sm:border-r-[16px] border-r-transparent border-b-[8px] border-b-[#F4EFE6]" />
              </div>
            </div>

            {/* Central Book Spine Crease, Binding Shadow & Stitches */}
            <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 bg-gradient-to-r from-stone-500/25 via-stone-700/40 to-stone-500/25 z-30 pointer-events-none shadow-2xl" />
            <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#9C8F79] z-35 pointer-events-none" />

            {/* Left Page Shadow Arch (Page Curves toward Spine) */}
            <div className="hidden lg:block absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent z-20 pointer-events-none" />
            {/* Right Page Shadow Arch (Page Curves toward Spine) */}
            <div className="hidden lg:block absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 to-transparent z-20 pointer-events-none" />

            {/* 3D TWO-PAGE BOOK SPREAD ARCHITECTURE */}
            <div
              style={{ perspective: '2000px' }}
              className="relative grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#D5CBBB] min-h-[480px] bg-[#F7F2E8]"
            >
              {/* STATIC LEFT PAGE (Warm Aged Parchment with Border) */}
              <div
                style={{
                  backgroundImage: 'radial-gradient(#4A3B2C 0.4px, transparent 0.4px)',
                  backgroundSize: '16px 16px',
                }}
                className="p-6 sm:p-8 bg-[#F8F4EB] relative shadow-inner"
              >
                {renderLeft(
                  isFlipping && flipDir === 'next'
                    ? spread + 1
                    : spread
                )}
              </div>

              {/* STATIC RIGHT PAGE (Reveals underneath as page flips) */}
              <div
                style={{
                  backgroundImage: 'radial-gradient(#4A3B2C 0.4px, transparent 0.4px)',
                  backgroundSize: '16px 16px',
                }}
                className="p-6 sm:p-8 bg-[#F8F4EB] relative shadow-inner"
              >
                {renderRight(
                  isFlipping && flipDir === 'next'
                    ? spread + 1
                    : spread
                )}
              </div>

              {/* ======================================================== */}
              {/* THE REAL 3D FLIPPING SHEET (LEMBAR KERTAS FISIK MEMBALIK) */}
              {/* ======================================================== */}
              {isFlipping && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: '50%',
                    transformOrigin: 'left center',
                    transform: `rotateY(${flipAngle}deg)`,
                    transformStyle: 'preserve-3d',
                    transition: 'transform 700ms cubic-bezier(0.35, 0.0, 0.2, 1)',
                    zIndex: 35,
                  }}
                  className="hidden lg:block pointer-events-none"
                >
                  {/* Sisi Muka Kertas (Halaman Kanan yang sedang membalik ke kiri) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      backgroundImage: 'radial-gradient(#4A3B2C 0.4px, transparent 0.4px)',
                      backgroundSize: '16px 16px',
                    }}
                    className="absolute inset-0 p-6 sm:p-8 bg-[#F8F4EB] border-l border-[#C9BFA9] shadow-2xl overflow-hidden"
                  >
                    {renderRight(flipDir === 'next' ? spread : spread - 1)}
                    {/* Bayangan Lipatan Lembar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900/20 via-stone-900/5 to-transparent pointer-events-none" />
                  </div>

                  {/* Sisi Belakang Kertas (Halaman Kiri tujuan yang sudah terbalik 180 derajat) */}
                  <div
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      backgroundImage: 'radial-gradient(#4A3B2C 0.4px, transparent 0.4px)',
                      backgroundSize: '16px 16px',
                    }}
                    className="absolute inset-0 p-6 sm:p-8 bg-[#F8F4EB] border-r border-[#C9BFA9] shadow-2xl overflow-hidden"
                  >
                    {renderLeft(flipDir === 'next' ? spread + 1 : spread)}
                    {/* Bayangan Punggung Kertas */}
                    <div className="absolute inset-0 bg-gradient-to-l from-stone-900/25 via-stone-900/5 to-transparent pointer-events-none" />
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* REALISTIC MULTI-LAYER PAPER THICKNESS (Tumpukan Lembar Buku di Sisi Bawah) */}
          <div className="relative mt-1">
            <div className="h-3 mx-2 bg-[#E5DEC9] rounded-b-xl border-x-2 border-b-2 border-[#C9BFA9] shadow-md flex items-center justify-between px-4">
              <div className="h-[1px] w-full bg-gradient-to-r from-[#BAAF98] via-[#D3C7AE] to-[#BAAF98]" />
            </div>
            <div className="h-2 mx-5 bg-[#D8CEB7] rounded-b-lg border-x border-b border-[#B8AC94] shadow-xs" />
            <div className="h-1.5 mx-8 bg-[#C8BCA3] rounded-b-md border-x border-b border-[#A99D85]" />
          </div>

        </div>

      </div>

    </div>
  );
};
