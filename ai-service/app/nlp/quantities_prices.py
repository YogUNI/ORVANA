"""
Modul ekstraksi kuantitas dan harga dari kalimat alami.
Mengacu pada docs/08-ai-modules.md Bagian 3.4.
"""

import re
from typing import List, Optional, Tuple

# Satuan dan faktor konversi ke kilogram (kg)
UNIT_MULTIPLIERS = {
    "kg": 1.0,
    "kilo": 1.0,
    "kilogram": 1.0,
    "kwintal": 100.0,
    "kuintal": 100.0,
    "kw": 100.0,
    "ton": 1000.0,
    "ons": 0.1,
    "gram": 0.001,
    "gr": 0.001,
}

QUANTITY_REGEX = re.compile(
    r'(?P<val>\d+(?:[.,]\d+)?)\s*(?P<unit>kg|kilo|kilogram|kwintal|kuintal|kw|ton|ons|gram|gr)\b',
    re.IGNORECASE
)

# Regex harga: "45 ribu", "45rb", "45.000", "45000", "Rp 45.000"
PRICE_REGEXES = [
    # Rp 45.000 / 45.000 / 45000 /kg
    re.compile(r'(?:rp\.?\s*)?(?P<num>\d{1,3}(?:\.\d{3})+|\d{4,7})(?:\s*(?:/|per)\s*(?:kg|kilo))?', re.IGNORECASE),
    # 45 ribu / 45rb / 45 rb
    re.compile(r'(?:harga\s*)?(?P<val>\d+(?:[.,]\d+)?)\s*(?P<mult>ribu|rb|k)\b(?:\s*(?:/|per)\s*(?:kg|kilo))?', re.IGNORECASE),
]

def parse_quantities(text: str) -> List[Tuple[float, int, int]]:
    """
    Ekstraksi kuantitas dalam kilogram.
    Returns: List of (quantity_kg, start_pos, end_pos)
    """
    results = []
    for m in QUANTITY_REGEX.finditer(text):
        raw_val = m.group("val").replace(",", ".")
        unit = m.group("unit").lower()
        multiplier = UNIT_MULTIPLIERS.get(unit, 1.0)
        try:
            qty_kg = float(raw_val) * multiplier
            results.append((round(qty_kg, 3), m.start(), m.end()))
        except ValueError:
            continue
    return results

def parse_prices(text: str) -> List[Tuple[float, int, int]]:
    """
    Ekstraksi nominal harga rupiah per kg.
    Returns: List of (price_rp, start_pos, end_pos)
    """
    results = []
    matched_spans = []

    # 1. Cari yang ada "ribu" / "rb" / "k" terlebih dahulu
    for m in PRICE_REGEXES[1].finditer(text):
        raw_val = m.group("val").replace(",", ".")
        try:
            val = float(raw_val) * 1000.0
            # Abaikan jika angka terlalu kecil atau tak realistis untuk harga
            if val >= 1000:
                results.append((round(val), m.start(), m.end()))
                matched_spans.append((m.start(), m.end()))
        except ValueError:
            continue

    # 2. Cari angka ribuan dengan titik (mis. "45.000" atau "30000")
    for m in PRICE_REGEXES[0].finditer(text):
        start, end = m.start(), m.end()
        # Jangan tumpang tindih dengan span "ribu"
        if any(s <= start < e or s < end <= e for (s, e) in matched_spans):
            continue

        num_str = m.group("num").replace(".", "")
        try:
            val = float(num_str)
            # Harga pangan realistis per kg berkisar antara 2.000 hingga 500.000
            if 2000 <= val <= 500000:
                results.append((round(val), start, end))
                matched_spans.append((start, end))
        except ValueError:
            continue

    return results
