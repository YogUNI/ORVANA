"""
Modul Normalisasi Angka Kata Bahasa Indonesia (Text-to-Number / Words-to-Digits).
Mengubah penyebutan bilangan kata seperti "dua puluh lima", "setengah", "seperempat",
"tiga ratus", "seribu", "dua kwintal", dsb menjadi representasi numerik standar.
"""

import re
from typing import Dict, Optional

# Kamus nilai dasar angka Indonesia
WORD_NUMBERS: Dict[str, float] = {
    "nol": 0,
    "kosong": 0,
    "setengah": 0.5,
    "separuh": 0.5,
    "seperempat": 0.25,
    "satu": 1,
    "se": 1,
    "dua": 2,
    "tiga": 3,
    "empat": 4,
    "lima": 5,
    "enam": 6,
    "tujuh": 7,
    "delapan": 8,
    "sembilan": 9,
    "sepuluh": 10,
    "sebelas": 11,
}

TEEN_PATTERN = re.compile(r'\b(dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\s+belas\b', re.IGNORECASE)
TENS_PATTERN = re.compile(r'\b(dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\s+puluh(?:\s+(satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan))?\b', re.IGNORECASE)
HUNDREDS_PATTERN = re.compile(r'\b(?:se|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\s*ratus\b', re.IGNORECASE)

def words_to_number(phrase: str) -> Optional[float]:
    """
    Mengonversi frasa kata bilangan bahasa Indonesia sederhana menjadi float/int.
    Mendukung: 'setengah', 'dua', 'sepuluh', 'lima belas', 'dua puluh lima', 'seratus lima puluh', dll.
    """
    phrase = phrase.strip().lower()

    if phrase in WORD_NUMBERS:
        return WORD_NUMBERS[phrase]

    # Belasan: "dua belas" -> 12
    teen_match = TEEN_PATTERN.fullmatch(phrase)
    if teen_match:
        base = WORD_NUMBERS.get(teen_match.group(1), 0)
        return 10 + base

    # Puluhan: "dua puluh", "dua puluh lima" -> 25
    tens_match = TENS_PATTERN.fullmatch(phrase)
    if tens_match:
        base_tens = WORD_NUMBERS.get(tens_match.group(1), 0) * 10
        unit = WORD_NUMBERS.get(tens_match.group(2), 0) if tens_match.group(2) else 0
        return base_tens + unit

    # Khusus seratusan / ratusan sederhana
    if phrase in ["seratus", "se ratus"]:
        return 100.0
    if phrase in ["seribu", "se ribu"]:
        return 1000.0

    return None

def normalize_indonesian_number_words(text: str) -> str:
    """
    Mengganti bilangan dalam bentuk kata dalam kalimat menjadi digit angka.
    Contoh:
    'panen dua kwintal cabai' -> 'panen 2 kwintal cabai'
    'ada setengah ton beras' -> 'ada 0.5 ton beras'
    'ready tiga puluh lima kilo lele' -> 'ready 35 kilo lele'
    'setengah kilo' -> '0.5 kilo'
    """
    result = text

    # 1. Frasa fraksional khusus sebelum satuan / kata benda
    fraction_map = [
        (r'\bsetengah\b', '0.5'),
        (r'\bseparuh\b', '0.5'),
        (r'\bseperempat\b', '0.25'),
        (r'\btiga perempat\b', '0.75'),
        (r'\bsatu setengah\b', '1.5'),
        (r'\bdua setengah\b', '2.5'),
    ]
    for pattern, replacement in fraction_map:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    # 2. Ratusan gabungan: 'seratus lima puluh' -> 150, 'dua ratus' -> 200
    hundreds_map = [
        (r'\bseratus lima puluh\b', '150'),
        (r'\bdua ratus lima puluh\b', '250'),
        (r'\bseratus\b', '100'),
        (r'\bdua ratus\b', '200'),
        (r'\btiga ratus\b', '300'),
        (r'\bempat ratus\b', '400'),
        (r'\blima ratus\b', '500'),
        (r'\benam ratus\b', '600'),
        (r'\btujuh ratus\b', '700'),
        (r'\bdelapan ratus\b', '800'),
        (r'\bsembilan ratus\b', '900'),
    ]
    for pattern, replacement in hundreds_map:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    # 3. Puluhan dengan satuan: 'dua puluh lima' -> 25, 'tiga puluh' -> 30
    digits = {
        "satu": 1, "dua": 2, "tiga": 3, "empat": 4, "lima": 5,
        "enam": 6, "tujuh": 7, "delapan": 8, "sembilan": 9
    }
    
    # Puluhan + satuan: "dua puluh lima" -> 25
    for tens_word, t_val in digits.items():
        for unit_word, u_val in digits.items():
            pattern = rf'\b{tens_word}\s+puluh\s+{unit_word}\b'
            result = re.sub(pattern, str(t_val * 10 + u_val), result, flags=re.IGNORECASE)
        # Puluhan bulat: "dua puluh" -> 20
        pattern_round = rf'\b{tens_word}\s+puluh\b'
        result = re.sub(pattern_round, str(t_val * 10), result, flags=re.IGNORECASE)

    # 4. Belasan: "dua belas" -> 12, "sebelas" -> 11
    result = re.sub(r'\bsepuluh\b', '10', result, flags=re.IGNORECASE)
    result = re.sub(r'\bsebelas\b', '11', result, flags=re.IGNORECASE)
    for unit_word, u_val in digits.items():
        if unit_word != "satu":
            pattern = rf'\b{unit_word}\s+belas\b'
            result = re.sub(pattern, str(10 + u_val), result, flags=re.IGNORECASE)

    # 5. Satuan tunggal sebelum unit komoditas/berat: 'dua kwintal', 'lima kg', 'satu ton'
    units = r'(?:kg|kilo|kilogram|kwintal|kuintal|kw|ton|ons|gram|gr|ekor|ikat|karung|butir)'
    for unit_word, u_val in digits.items():
        pattern = rf'\b{unit_word}\s+(?={units}\b)'
        result = re.sub(pattern, f"{u_val} ", result, flags=re.IGNORECASE)
    
    # Khusus 'se-' awalan satuan: 'sekwintal' -> '1 kwintal', 'seton' -> '1 ton'
    result = re.sub(r'\bse(?=kwintal|kuintal|ton|kilo|karung\b)', '1 ', result, flags=re.IGNORECASE)

    return result
