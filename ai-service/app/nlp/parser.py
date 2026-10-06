"""
Mesin pengurai kalimat penawaran stok petani (Modul A - docs/08).
Menggabungkan kamus komoditas, kuantitas kg, tanggal relatif, dan harga.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.nlp.commodities import find_commodity_matches, COMMODITY_SYNONYMS
from app.nlp.quantities_prices import parse_quantities, parse_prices
from app.nlp.dates import parse_dates
from app.nlp.classifier import nlp_engine
from app.nlp.number_words import normalize_indonesian_number_words
from app.nlp.preprocessor import normalize_slang_and_dialect

class SupplyCandidate(BaseModel):
    commodityName: str
    commodityCategory: str
    quantityKg: Optional[float] = None
    harvestDate: Optional[str] = None
    askingPrice: Optional[float] = None
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    missing: List[str] = Field(default_factory=list)

class ParseTextResponse(BaseModel):
    intent: str = "OFFER_STOCK"
    intentConfidence: float = 0.90
    candidates: List[SupplyCandidate]
    warnings: List[str] = Field(default_factory=list)
    rawText: str

def parse_supply_sentence(text: str, base_date: Optional[datetime] = None) -> ParseTextResponse:
    if base_date is None:
        base_date = datetime.now()

    warnings: List[str] = []

    # 1. Bersihkan slang / dialek petani dan normalisasi kata bilangan
    slang_cleaned = normalize_slang_and_dialect(text)
    norm_text = normalize_indonesian_number_words(slang_cleaned)

    # 2. Klasifikasi Niat Kalimat (ML TF-IDF Naive Bayes)
    predicted_intent, intent_conf = nlp_engine.predict_intent(norm_text)
    
    # 3. Temukan komoditas (Kamus Sinonim Eksak)
    commodity_matches = find_commodity_matches(norm_text)

    # 3. Jika tidak ditemukan eksak, coba Fuzzy Semantic Matching untuk toleransi typo
    if not commodity_matches:
        words = norm_text.split()
        for w in words:
            clean_w = "".join(c for c in w if c.isalnum())
            if len(clean_w) >= 3:
                fuzzy_canon, f_score = nlp_engine.fuzzy_match_commodity(clean_w)
                if fuzzy_canon and f_score >= 0.65:
                    cat = COMMODITY_SYNONYMS[fuzzy_canon][0]
                    commodity_matches.append((fuzzy_canon, cat, norm_text.lower().find(clean_w.lower()), 0))
                    warnings.append(f"Mendeteksi kemungkinan komoditas '{fuzzy_canon}' dari kata '{clean_w}'.")
                    break

    if not commodity_matches:
        return ParseTextResponse(
            intent=predicted_intent,
            intentConfidence=intent_conf,
            candidates=[],
            warnings=["Komoditas pangan dan jumlah belum terbaca dengan jelas."],
            rawText=text
        )

    # 4. Temukan entitas pendukung dari teks yang ternormalisasi
    quantities = parse_quantities(norm_text)
    prices = parse_prices(norm_text)
    dates = parse_dates(norm_text, base_date=base_date)

    candidates: List[SupplyCandidate] = []

    # Jika hanya ada 1 komoditas, kaitkan semua entitas terdekat
    if len(commodity_matches) == 1:
        comm_name, comm_cat, c_start, c_end = commodity_matches[0]
        qty = quantities[0][0] if quantities else None
        price = prices[0][0] if prices else None
        h_date = dates[0][0] if dates else (base_date.strftime("%Y-%m-%d"))

        missing = []
        confidence = 0.95
        if qty is None:
            missing.append("quantityKg")
            confidence -= 0.25
        if price is None:
            missing.append("askingPrice")
            confidence -= 0.10
        if not dates:
            # Default ke hari ini jika tidak disebutkan
            missing.append("harvestDateExplicit")

        if qty and qty < 1.0:
            warnings.append(f"Jumlah kuantitas sangat kecil ({qty} kg). Pastikan satuan sudah sesuai.")

        candidates.append(
            SupplyCandidate(
                commodityName=comm_name,
                commodityCategory=comm_cat,
                quantityKg=qty,
                harvestDate=h_date,
                askingPrice=price,
                confidence=max(0.5, round(confidence, 2)),
                missing=missing
            )
        )
    else:
        # Multiple commodities: Pisahkan batasan klausa (Clause Segmentation)
        # Hitung boundary teks dari komoditas saat ini ke komoditas berikutnya
        norm_text = normalize_indonesian_number_words(text)
        
        # Sort commodities berdasarkan kemunculan di teks
        sorted_commodities = sorted(commodity_matches, key=lambda x: x[2])
        
        # Multiple commodities: Global Optimal Entity-to-Commodity Binding
        # 1. Asosiasikan setiap kuantitas ke komoditas yang posisinya paling dekat
        comm_qtys: Dict[int, Optional[float]] = {i: None for i in range(len(sorted_commodities))}
        used_qtys = set()
        for i, (comm_name, comm_cat, c_start, c_end) in enumerate(sorted_commodities):
            best_q = None
            best_dist = float("inf")
            for q_idx, (q_val, q_s, q_e) in enumerate(quantities):
                if q_idx in used_qtys:
                    continue
                dist = abs((q_s + q_e) / 2 - (c_start + c_end) / 2)
                if dist < best_dist and dist < 60: # Threshold jarak karakter wajar
                    best_dist = dist
                    best_q = (q_idx, q_val)
            if best_q is not None:
                used_qtys.add(best_q[0])
                comm_qtys[i] = best_q[1]

        # 2. Asosiasikan setiap harga ke komoditas yang posisinya paling dekat
        comm_prices: Dict[int, Optional[float]] = {i: None for i in range(len(sorted_commodities))}
        used_prices = set()
        for i, (comm_name, comm_cat, c_start, c_end) in enumerate(sorted_commodities):
            best_p = None
            best_dist = float("inf")
            for p_idx, (p_val, p_s, p_e) in enumerate(prices):
                if p_idx in used_prices:
                    continue
                dist = abs((p_s + p_e) / 2 - (c_start + c_end) / 2)
                if dist < best_dist and dist < 60:
                    best_dist = dist
                    best_p = (p_idx, p_val)
            if best_p is not None:
                used_prices.add(best_p[0])
                comm_prices[i] = best_p[1]

        # 3. Bentuk candidate list per komoditas
        global_date = dates[0][0] if dates else base_date.strftime("%Y-%m-%d")
        for i, (comm_name, comm_cat, c_start, c_end) in enumerate(sorted_commodities):
            matched_qty = comm_qtys.get(i)
            matched_price = comm_prices.get(i)
            
            # Cari tanggal khusus komoditas jika ada lebih dari 1 tanggal
            matched_date = global_date
            if len(dates) > 1:
                best_d = None
                best_d_dist = float("inf")
                for d_val, d_s, d_e in dates:
                    dist = abs((d_s + d_e) / 2 - (c_start + c_end) / 2)
                    if dist < best_d_dist:
                        best_d_dist = dist
                        best_d = d_val
                if best_d:
                    matched_date = best_d

            missing = []
            confidence = 0.90
            if matched_qty is None:
                missing.append("quantityKg")
                confidence -= 0.20
            if matched_price is None:
                missing.append("askingPrice")
                confidence -= 0.10

            candidates.append(
                SupplyCandidate(
                    commodityName=comm_name,
                    commodityCategory=comm_cat,
                    quantityKg=matched_qty,
                    harvestDate=matched_date,
                    askingPrice=matched_price,
                    confidence=max(0.5, round(confidence, 2)),
                    missing=missing
                )
            )

    return ParseTextResponse(
        intent=predicted_intent,
        intentConfidence=intent_conf,
        candidates=candidates,
        warnings=warnings,
        rawText=text
    )
