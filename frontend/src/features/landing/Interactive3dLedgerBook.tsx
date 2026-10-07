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
  // page 0: Lembar 1 (Kas) & Lembar 2 (Produsen)
  // page 1: Lembar 3 (Logistik) & Lembar 4 (Mutu)
  // page 2: Lembar 5 (Paspor QR) & Lembar 6 (Audit Sah)
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [flipState, setFlipState] = useState<'idle' | 'flipping-next' | 'flipping-prev'>('idle');
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const startXRef = useRef<number | null>(null);
  const totalPages = 3;

  const turnNext = () => {
    if (flipState !== 'idle' || pageIndex >= totalPages - 1) return;
    setFlipState('flipping-next');
    setTimeout(() => {
      setPageIndex((prev) => prev + 1);
      setFlipState('idle');
      setDragOffset(0);
    }, 600);
  };

  const turnPrev = () => {
    if (flipState !== 'idle' || pageIndex <= 0) return;
    setFlipState('flipping-prev');
    setTimeout(() => {
      setPageIndex((prev) => prev - 1);
      setFlipState('idle');
      setDragOffset(0);
    }, 600);
  };

  // Mouse / Touch Dragging to flip page like real paper
  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || startXRef.current === null) return;
    const diff = e.clientX - startXRef.current;
    // Limit drag bounds
    if (diff < 0 && pageIndex < totalPages - 1) {
      setDragOffset(Math.max(diff, -160));
    } else if (diff > 0 && pageIndex > 0) {
      setDragOffset(Math.min(diff, 160));
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -60) {
      turnNext();
    } else if (dragOffset > 60) {
      turnPrev();
    } else {
      setDragOffset(0);
    }
    startXRef.current = null;
  };

  // Render Content for Page Left & Page Right based on pageIndex
  const renderLeftPageContent = (idx: number) => {
    if (idx === 0) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                  LEMBAR #01 • KEUANGAN DESA
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                  Arus Kas Petani & Nelayan
                </h3>
              </div>
              <div className="border border-emerald-700/50 rounded-lg px-2 py-0.5 rotate-[-2deg] bg-emerald-50">
                <span className="text-[9px] font-serif font-black text-emerald-800 flex items-center gap-0.5">
                  <Check className="w-3 h-3 text-emerald-700" />
                  AUDIT SAH
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 shadow-2xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  Total Kas Belanja Langsung
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
                  100% Hak Petani
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950">
                {isLoading ? <Skeleton className="h-8 w-36" /> : formatRupiah(impact?.localSpendingRupiah || 0)}
              </div>
              <p className="text-[11px] text-stone-600 font-sans leading-relaxed pt-1 border-t border-stone-200/60">
                Dana dibayarkan langsung tanpa potongan perantara begitu bahan lolos uji mutu dapur.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/60 border border-stone-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-stone-700">
                <span>Potongan Calo:</span>
                <strong className="text-emerald-700">Rp 0 (Tanpa Makelar)</strong>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Status Rekening:</span>
                <strong className="text-emerald-800">Cair Bersih ke Desa</strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span>Append-Only Ledger</span>
            <span>Halaman 1 dari 6</span>
          </div>
        </div>
      );
    } else if (idx === 1) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                  LEMBAR #03 • TIMBANGAN PANEN
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                  Volume Pangan Bergizi
                </h3>
              </div>
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-amber-200 shadow-2xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-900">
                <span>Berat Bersih Lolos Timbang</span>
                <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                  Segar Bergizi
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-stone-950">
                {isLoading ? <Skeleton className="h-8 w-32" /> : formatKg(impact?.totalDeliveredKg || 0)}
              </div>
              <p className="text-[11px] text-stone-600 font-sans leading-relaxed pt-1 border-t border-stone-200/60">
                Beras, lele segar, telur ayam, dan sayuran hijau lokal yang telah diserap dapur.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/60 border border-stone-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <div>
                  <span className="text-[9px] font-mono text-stone-500 block uppercase">Radius Pengiriman</span>
                  <strong className="font-mono text-stone-900">{impact?.avgDistanceKm || 0} km</strong>
                </div>
              </div>
              <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Emisi Rendah
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span>Timbangan Digital Terhubung</span>
            <span>Halaman 3 dari 6</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                  LEMBAR #05 • PASPOR PANEN
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                  Lacak Asal Makanan QR
                </h3>
              </div>
              <QrCode className="w-5 h-5 text-emerald-850" />
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2.5 mb-3">
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
              <div className="p-2 rounded bg-stone-50 text-[10px] font-mono space-y-1 text-stone-700 border border-stone-200">
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

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span>Transparansi 100% Publik</span>
            <span>Halaman 5 dari 6</span>
          </div>
        </div>
      );
    }
  };

  const renderRightPageContent = (idx: number) => {
    if (idx === 0) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                  LEMBAR #02 • MITRA DAERAH
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                  Mitra Produsen Desa
                </h3>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {impact?.producersInvolved || 5} Kelompok Tani
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {[
                { name: 'Poktan Makmur Subur', komoditas: 'Beras & Sayur', desa: 'Desa Sukamaju' },
                { name: 'Koperasi Mina Bahari', komoditas: 'Ikan Lele & Nila', desa: 'Pesisir Citarum' },
                { name: 'Ternak Unggas Berkah', komoditas: 'Telur Ayam Segar', desa: 'Kec. Parung' },
              ].map((prod, pIdx) => (
                <div key={pIdx} className="p-2.5 rounded-xl bg-white/80 border border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-stone-900">{prod.name}</h4>
                    <span className="text-[10px] text-stone-500 font-mono">{prod.desa}</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {prod.komoditas}
                  </span>
                </div>
              ))}
            </div>

            {/* Corner Page Curl / Flip Visual Guide */}
            <div
              onClick={turnNext}
              className="group p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-900 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                <Hand className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
                <span>Usap / Klik untuk Buka Lembar 2</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="text-emerald-800 font-bold">● Akses Publik Bebas</span>
            <span>Halaman 2 dari 6</span>
          </div>
        </div>
      );
    } else if (idx === 1) {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                  LEMBAR #04 • INSPEKSI MUTU GIZI
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                  Laporan Ahli Gizi (QC)
                </h3>
              </div>
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-purple-200 shadow-2xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-900">
                <span>Tingkat Kelulusan Mutu QC</span>
                <span className="text-[9px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">
                  Uji Ketat
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-purple-950">
                {isLoading ? <Skeleton className="h-8 w-20" /> : `${impact?.qualityPassRatePct || 0}%`}
              </div>
              <p className="text-[11px] text-stone-600 font-sans leading-relaxed pt-1 border-t border-stone-200/60">
                Bahan yang busuk atau tidak segar langsung ditolak sistem demi kesehatan gizi anak-anak penerima makanan.
              </p>
            </div>

            <div
              onClick={turnNext}
              className="group p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/90 border border-purple-200 text-purple-950 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                <Hand className="w-3.5 h-3.5 text-purple-700 group-hover:translate-x-1 transition-transform" />
                <span>Usap / Klik untuk Lembar 3</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="text-purple-800 font-bold">● Standar Dinkes</span>
            <span>Halaman 4 dari 6</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                  LEMBAR #06 • AUDIT PUBLIK
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                  Sertifikat Akuntabilitas
                </h3>
              </div>
              <FileCheck className="w-5 h-5 text-emerald-800" />
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 shadow-2xs space-y-2.5 mb-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 text-[10px] font-mono font-bold">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>ANTI-MARKUP ANGGARAN</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Setiap transaksi bersifat permanen dan tidak bisa direkayasa secara manual.
              </p>
              <div className="pt-1">
                <Link to="/auditor/dashboard" className="block">
                  <Button size="sm" className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Buka Seluruh Buku Kas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
            <span className="text-emerald-800 font-bold">● Buku Lengkap</span>
            <span>Halaman 6 dari 6</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative select-none">
      
      {/* Top Subtle Ledger Controller */}
      <div className="flex items-center justify-between gap-2 mb-4 px-2">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-600">
          <Hand className="w-4 h-4 text-emerald-700 animate-pulse" />
          <span className="hidden sm:inline">Usap / Tarik lembar buku ke samping untuk membalik halaman</span>
          <span className="sm:hidden">Usap untuk membalik lembar buku</span>
        </div>

        {/* Turn Buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs text-xs font-mono">
          <button
            type="button"
            onClick={turnPrev}
            disabled={pageIndex === 0 || flipState !== 'idle'}
            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800"
            title="Balik ke Lembar Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-bold text-stone-800 text-[11px]">
            Lembar {pageIndex + 1} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={turnNext}
            disabled={pageIndex >= totalPages - 1 || flipState !== 'idle'}
            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800"
            title="Balik ke Lembar Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D BOOK STAGE CONTAINER WITH PERSPECTIVE */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative [perspective:1800px] cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* Outer Hardcover Frame with Realistic Depth */}
        <div className="relative rounded-3xl bg-[#EDE7DD] p-3 sm:p-5 shadow-elevated border border-stone-300">
          
          {/* Main Book Shell */}
          <div className="relative rounded-2xl bg-[#F8F5EE] border border-[#DDD5C5] shadow-2xl overflow-hidden min-h-[460px]">
            
            {/* Top Red-Gold Silk Ribbon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
              <div className="w-8 h-12 bg-gradient-to-b from-amber-600 via-amber-500 to-amber-700 shadow-md flex items-end justify-center pb-1">
                <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[8px] border-b-[#F8F5EE]" />
              </div>
            </div>

            {/* Central Book Spine Fold Crease & Shadow */}
            <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-stone-400/20 via-stone-500/35 to-stone-400/20 z-20 pointer-events-none shadow-inner" />
            <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-stone-300 z-25 pointer-events-none" />

            {/* ======================================================== */}
            {/* TWO-PAGE SPREAD WITH 3D REALISTIC PAGE FLIP ANIMATION    */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-300/80 relative z-10 min-h-[460px]">
              
              {/* HALAMAN KIRI (STATIC / TARGET) */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative overflow-hidden">
                {renderLeftPageContent(pageIndex)}
              </div>

              {/* HALAMAN KANAN (FLIPPABLE 3D LEAF) */}
              <div className="p-6 sm:p-8 bg-gradient-to-l from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] relative overflow-hidden [transform-style:preserve-3d]">
                
                {/* Visual Leaf Page Content */}
                <div
                  style={{
                    transformOrigin: 'left center',
                    transform:
                      flipState === 'flipping-next'
                        ? 'rotateY(-180deg)'
                        : flipState === 'flipping-prev'
                        ? 'rotateY(0deg)'
                        : `rotateY(${dragOffset * 0.4}deg)`,
                    transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="h-full w-full relative [transform-style:preserve-3d]"
                >
                  {/* Front Side of Right Page */}
                  <div className="h-full w-full [backface-visibility:hidden]">
                    {renderRightPageContent(pageIndex)}
                  </div>

                  {/* Back Side of Flipping Page (Shadow & Blank Paper Texture during turn) */}
                  <div className="absolute inset-0 bg-[#EFE9DC] [transform:rotateY(180deg)] [backface-visibility:hidden] p-6 flex items-center justify-center border-r border-stone-300 shadow-2xl">
                    <div className="text-center opacity-40 font-serif italic text-stone-600">
                      Membalik lembaran buku...
                    </div>
                  </div>
                </div>

                {/* Animated Page Flip Shadow Gradient */}
                {flipState === 'flipping-next' && (
                  <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-stone-900/30 to-transparent pointer-events-none animate-pulse" />
                )}
              </div>

            </div>

          </div>

          {/* Book Bottom Page Edges Simulation (Stacked Pages Effect) */}
          <div className="h-2.5 mx-3 bg-[#E2DAC9] rounded-b-xl border-x border-b border-[#D0C5B0] shadow-2xs" />
          <div className="h-1 mx-6 bg-[#D8CEBA] rounded-b-lg border-x border-b border-[#C4B79E]" />

        </div>
      </div>
    </div>
  );
};
