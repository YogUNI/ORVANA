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

    # 1. Klasifikasi Niat Kalimat (ML TF-IDF Naive Bayes)
    predicted_intent, intent_conf = nlp_engine.predict_intent(text)
    
    # 2. Temukan komoditas (Kamus Sinonim Eksak)
    commodity_matches = find_commodity_matches(text)

    # 3. Jika tidak ditemukan eksak, coba Fuzzy Semantic Matching untuk toleransi typo
    if not commodity_matches:
        words = text.split()
        for w in words:
            clean_w = "".join(c for c in w if c.isalnum())
            if len(clean_w) >= 3:
                fuzzy_canon, f_score = nlp_engine.fuzzy_match_commodity(clean_w)
                if fuzzy_canon and f_score >= 0.65:
                    cat = COMMODITY_SYNONYMS[fuzzy_canon][0]
                    commodity_matches.append((fuzzy_canon, cat, text.lower().find(clean_w.lower()), 0))
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

    # 2. Temukan entitas pendukung
    quantities = parse_quantities(text)
    prices = parse_prices(text)
    dates = parse_dates(text, base_date=base_date)

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
        # Multiple commodities: Asosiasikan entitas berdasarkan jarak indeks teks (proximity matching)
        for i, (comm_name, comm_cat, c_start, c_end) in enumerate(commodity_matches):
            next_start = commodity_matches[i + 1][2] if i + 1 < len(commodity_matches) else len(text)
            
            # Cari kuantitas dalam range klausa komoditas ini
            matched_qty = None
            for q_val, q_s, q_e in quantities:
                if c_start - 30 <= q_s <= next_start:
                    matched_qty = q_val
                    break

            # Cari harga dalam range klausa
            matched_price = None
            for p_val, p_s, p_e in prices:
                if c_start - 10 <= p_s <= next_start:
                    matched_price = p_val
                    break

            # Tanggal panen (seringkali berlaku global untuk satu kalimat jika hanya 1 tanggal)
            matched_date = dates[0][0] if dates else base_date.strftime("%Y-%m-%d")

            missing = []
            confidence = 0.88
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
