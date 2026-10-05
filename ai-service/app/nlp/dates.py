"""
Modul ekstraksi tanggal panen relatif (besok, lusa, minggu depan, tgl N).
Mengacu pada docs/08-ai-modules.md Bagian 3.4.
Zona waktu default: Asia/Jakarta.
"""

from datetime import datetime, timedelta
import re
from typing import List, Optional, Tuple

MONTH_NAMES = {
    "januari": 1, "jan": 1,
    "februari": 2, "feb": 2,
    "maret": 3, "mar": 3,
    "april": 4, "apr": 4,
    "mei": 5,
    "juni": 6, "jun": 6,
    "juli": 7, "jul": 7,
    "agustus": 8, "agt": 8, "ags": 8,
    "september": 9, "sep": 9,
    "oktober": 10, "okt": 10,
    "november": 11, "nov": 11,
    "desember": 12, "des": 12,
}

DATE_REGEX_PATTERNS = [
    # "hari ini"
    (re.compile(r'\bhari\s+ini\b', re.IGNORECASE), lambda base: base),
    # "besok"
    (re.compile(r'\bbesok\b', re.IGNORECASE), lambda base: base + timedelta(days=1)),
    # "lusa"
    (re.compile(r'\blusa\b', re.IGNORECASE), lambda base: base + timedelta(days=2)),
    # "minggu depan" / "pekan depan" / "senin depan"
    (
        re.compile(r'\b(?:minggu|pekan|senin)\s+depan\b', re.IGNORECASE),
        lambda base: base + timedelta(days=(7 - base.weekday()) % 7 or 7) # Senin pekan depan
    ),
    # "tgl 15" / "tanggal 15"
    (
        re.compile(r'\b(?:tgl|tanggal)\s+(?P<day>\d{1,2})\b', re.IGNORECASE),
        "CALCULATE_DAY_OF_MONTH"
    ),
    # "15 oktober" / "15 okt 2026"
    (
        re.compile(r'\b(?P<day>\d{1,2})\s+(?P<month>januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agt|ags|sep|okt|nov|des)(?:\s+(?P<year>\d{4}))?\b', re.IGNORECASE),
        "CALCULATE_FULL_DATE"
    ),
]

def parse_dates(text: str, base_date: Optional[datetime] = None) -> List[Tuple[str, int, int]]:
    """
    Ekstraksi tanggal dalam format ISO 'YYYY-MM-DD'.
    Returns: List of (iso_date, start_pos, end_pos)
    """
    if base_date is None:
        base_date = datetime.now()

    results = []
    matched_spans = []

    for pattern, handler in DATE_REGEX_PATTERNS:
        for m in pattern.finditer(text):
            start, end = m.start(), m.end()
            if any(s <= start < e or s < end <= e for (s, e) in matched_spans):
                continue

            target_date = None
            if callable(handler):
                target_date = handler(base_date)
            elif handler == "CALCULATE_DAY_OF_MONTH":
                day = int(m.group("day"))
                if 1 <= day <= 31:
                    year = base_date.year
                    month = base_date.month
                    # Jika tanggal sudah lewat di bulan berjalan, proyeksikan ke bulan depan
                    if day < base_date.day:
                        if month == 12:
                            month = 1
                            year += 1
                        else:
                            month += 1
                    try:
                        target_date = datetime(year, month, day)
                    except ValueError:
                        continue
            elif handler == "CALCULATE_FULL_DATE":
                day = int(m.group("day"))
                month_str = m.group("month").lower()
                month = MONTH_NAMES.get(month_str, base_date.month)
                year_str = m.group("year")
                year = int(year_str) if year_str else base_date.year
                try:
                    target_date = datetime(year, month, day)
                except ValueError:
                    continue

            if target_date:
                iso_str = target_date.strftime("%Y-%m-%d")
                results.append((iso_str, start, end))
                matched_spans.append((start, end))

    return results
