import React, { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
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
  const bookContainerRef = useRef<HTMLDivElement | null>(null);
  const pageFlipInstanceRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(6);

  useEffect(() => {
    if (!bookContainerRef.current) return;

    // Destroy existing instance if any
    if (pageFlipInstanceRef.current) {
      try {
        pageFlipInstanceRef.current.destroy();
      } catch (e) {
        // ignore
      }
    }

    try {
      const pageFlip = new PageFlip(bookContainerRef.current, {
        width: 460,
        height: 520,
        size: 'stretch',
        minWidth: 320,
        maxWidth: 560,
        minHeight: 440,
        maxHeight: 620,
        maxShadowOpacity: 0.55,
        showCover: false,
        usePortrait: false,
        mobileScrollSupport: false,
        swipeDistance: 30,
        drawShadow: true,
        flippingTime: 700,
        useMouseEvents: true,
        startPage: 0,
      });

      pageFlip.loadFromHTML(bookContainerRef.current.querySelectorAll('.ledger-page'));

      pageFlip.on('flip', (e: any) => {
        setCurrentPage(e.data);
      });

      pageFlipInstanceRef.current = pageFlip;
      setTotalPages(pageFlip.getPageCount());
    } catch (err) {
      console.error('PageFlip initialization error:', err);
    }

    return () => {
      if (pageFlipInstanceRef.current) {
        try {
          pageFlipInstanceRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const flipNext = () => {
    if (pageFlipInstanceRef.current) {
      pageFlipInstanceRef.current.flipNext();
    }
  };

  const flipPrev = () => {
    if (pageFlipInstanceRef.current) {
      pageFlipInstanceRef.current.flipPrev();
    }
  };

  return (
    <div className="relative select-none">
      
      {/* Top Ledger Controller */}
      <div className="flex items-center justify-between gap-2 mb-4 px-2">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-600">
          <Hand className="w-4 h-4 text-emerald-700 animate-pulse" />
          <span className="hidden sm:inline">Pegang sudut halaman atau usap untuk membalik kertas secara alami</span>
          <span className="sm:hidden">Usap sudut halaman untuk membalik</span>
        </div>

        {/* Turn Buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs text-xs font-mono">
          <button
            type="button"
            onClick={flipPrev}
            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800 cursor-pointer"
            title="Balik ke Lembar Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-bold text-stone-800 text-[11px]">
            Halaman {currentPage + 1} - {currentPage + 2} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={flipNext}
            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-stone-800 cursor-pointer"
            title="Balik ke Lembar Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Outer Hardcover Frame with Depth */}
      <div className="relative rounded-3xl bg-[#EDE7DD] p-3 sm:p-5 shadow-elevated border border-stone-300">
        
        {/* Main Book Shell */}
        <div className="relative rounded-2xl bg-[#F8F5EE] border border-[#DDD5C5] shadow-2xl overflow-hidden min-h-[480px]">
          
          {/* Top Red-Gold Silk Bookmark Ribbon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
            <div className="w-8 h-12 bg-gradient-to-b from-amber-600 via-amber-500 to-amber-700 shadow-md flex items-end justify-center pb-1">
              <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[8px] border-b-[#F8F5EE]" />
            </div>
          </div>

          {/* Central Spine Fold Crease & Shadow */}
          <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-stone-400/20 via-stone-500/35 to-stone-400/20 z-20 pointer-events-none shadow-inner" />
          <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-stone-300 z-25 pointer-events-none" />

          {/* ======================================================== */}
          {/* PAGE-FLIP CANVAS CONTAINER (REAL PHYSICS ENGINE)         */}
          {/* ======================================================== */}
          <div
            ref={bookContainerRef}
            className="w-full min-h-[480px] overflow-hidden"
          >
            {/* ==================== HALAMAN 1 ==================== */}
            <div className="ledger-page p-6 sm:p-8 bg-gradient-to-r from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] flex flex-col justify-between border-r border-stone-200 shadow-inner">
              <div>
                <div className="flex items-start justify-between border-b-2 border-stone-300/90 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-stone-500 uppercase tracking-widest block">
                      LEMBAR #01 • KEUANGAN DESA
                    </span>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                      Arus Kas Petani & Nelayan
                    </h3>
                  </div>
                  <div className="border border-emerald-700/60 rounded-lg px-2 py-0.5 rotate-[-2deg] bg-emerald-50">
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
                    Dana dibayarkan langsung tanpa potongan calo begitu bahan lolos uji mutu dapur.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-stone-200 text-xs font-mono space-y-1">
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

            {/* ==================== HALAMAN 2 ==================== */}
            <div className="ledger-page p-6 sm:p-8 bg-gradient-to-l from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] flex flex-col justify-between border-l border-stone-200 shadow-inner">
              <div>
                <div className="flex items-start justify-between border-b-2 border-stone-300/90 pb-3 mb-4">
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

                <div
                  onClick={flipNext}
                  className="group p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Hand className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
                    <span>Tarik Sudut Lembaran untuk Balik</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                <span className="text-emerald-800 font-bold">● Akses Publik Bebas</span>
                <span>Halaman 2 dari 6</span>
              </div>
            </div>

            {/* ==================== HALAMAN 3 ==================== */}
            <div className="ledger-page p-6 sm:p-8 bg-gradient-to-r from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] flex flex-col justify-between border-r border-stone-200 shadow-inner">
              <div>
                <div className="flex items-start justify-between border-b-2 border-stone-300/90 pb-3 mb-4">
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

                <div className="p-3 rounded-xl bg-white/70 border border-stone-200 flex items-center justify-between text-xs">
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

            {/* ==================== HALAMAN 4 ==================== */}
            <div className="ledger-page p-6 sm:p-8 bg-gradient-to-l from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] flex flex-col justify-between border-l border-stone-200 shadow-inner">
              <div>
                <div className="flex items-start justify-between border-b-2 border-stone-300/90 pb-3 mb-4">
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
                  onClick={flipNext}
                  className="group p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Hand className="w-3.5 h-3.5 text-purple-700 group-hover:translate-x-1 transition-transform" />
                    <span>Tarik Sudut Lembaran untuk Balik</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                <span className="text-purple-800 font-bold">● Standar Dinkes</span>
                <span>Halaman 4 dari 6</span>
              </div>
            </div>

            {/* ==================== HALAMAN 5 ==================== */}
            <div className="ledger-page p-6 sm:p-8 bg-gradient-to-r from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] flex flex-col justify-between border-r border-stone-200 shadow-inner">
              <div>
                <div className="flex items-start justify-between border-b-2 border-stone-300/90 pb-3 mb-4">
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

            {/* ==================== HALAMAN 6 ==================== */}
            <div className="ledger-page p-6 sm:p-8 bg-gradient-to-l from-[#FAF7F0] via-[#FAF6EE] to-[#F5F0E6] flex flex-col justify-between border-l border-stone-200 shadow-inner">
              <div>
                <div className="flex items-start justify-between border-b-2 border-stone-300/90 pb-3 mb-4">
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

          </div>

        </div>

        {/* Book Bottom Page Edges Simulation (Stacked Pages Effect) */}
        <div className="h-2.5 mx-3 bg-[#E2DAC9] rounded-b-xl border-x border-b border-[#D0C5B0] shadow-2xs" />
        <div className="h-1 mx-6 bg-[#D8CEBA] rounded-b-lg border-x border-b border-[#C4B79E]" />

      </div>
    </div>
  );
};
