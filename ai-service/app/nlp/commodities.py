"""
Kamus komoditas pangan lokal dan sinonim dialek Indonesia / Sunda / Jawa.
Mengacu pada docs/08-ai-modules.md Bagian 3.5.
"""

from typing import Dict, List, Tuple

COMMODITY_SYNONYMS: Dict[str, Tuple[str, List[str]]] = {
    # key: canonical_name, value: (default_category, list_of_synonyms)
    "Cabai rawit": (
        "SPICE",
        ["cabai rawit", "cabe rawit", "cabai", "cabe", "lombok rawit", "rawit", "cengek"]
    ),
    "Bawang merah": (
        "SPICE",
        ["bawang merah", "bawang", "brambang", "bawmer"]
    ),
    "Bayam": (
        "VEGETABLE",
        ["bayam", "bayem", "bayam hijau", "bayam cabut"]
    ),
    "Kangkung": (
        "VEGETABLE",
        ["kangkung", "kangkong", "kangkung darat", "kangkung air"]
    ),
    "Wortel": (
        "VEGETABLE",
        ["wortel", "karot", "wortel lokal"]
    ),
    "Tomat": (
        "VEGETABLE",
        ["tomat", "tomat merah", "tomat buah", "tomat sayur"]
    ),
    "Ikan lele": (
        "FISH",
        ["ikan lele", "lele", "lele sangkuriang", "lele dumbo"]
    ),
    "Ikan nila": (
        "FISH",
        ["ikan nila", "nila", "nilem", "nila merah", "nila hitam"]
    ),
    "Telur ayam": (
        "POULTRY_EGG",
        ["telur ayam", "telor ayam", "telur", "telor", "endog"]
    ),
    "Ayam potong": (
        "POULTRY_EGG",
        ["ayam potong", "ayam", "broiler", "ayam sayur", "daging ayam"]
    ),
    "Tempe": (
        "PROTEIN_PROCESSED",
        ["tempe", "tempeh", "tempe kedelai", "tempe daun"]
    ),
    "Beras": (
        "STAPLE",
        ["beras", "beras putih", "beras pandan wangi", "beras setra ramos"]
    ),
    "Pisang": (
        "FRUIT",
        ["pisang", "gedang", "pisang ambon", "pisang cavendish", "pisang raja"]
    ),
}

def find_commodity_matches(text: str) -> List[Tuple[str, str, int, int]]:
    """
    Mencari kecocokan komoditas dalam teks.
    Mengembalikan daftar tuple: (canonical_name, category, start_idx, end_idx)
    Diurutkan berdasarkan kata terpanjang terlebih dahulu untuk mencegah overlapping palsu.
    """
    matches = []
    text_lower = text.lower()
    
    # Kumpulkan semua sinonim dan urutkan dari yang terpanjang ke terpendek
    all_pairs = []
    for canonical_name, (cat, synonyms) in COMMODITY_SYNONYMS.items():
        for syn in synonyms:
            all_pairs.append((syn, canonical_name, cat))
    all_pairs.sort(key=lambda x: len(x[0]), reverse=True)

    matched_spans = []

    for syn, canonical_name, cat in all_pairs:
        start = 0
        while True:
            idx = text_lower.find(syn, start)
            if idx == -1:
                break
            end = idx + len(syn)

            # Cek boundary kata agar "ayam" tidak match di tengah kata lain
            char_before = text_lower[idx - 1] if idx > 0 else " "
            char_after = text_lower[end] if end < len(text_lower) else " "
            if not char_before.isalnum() and not char_after.isalnum():
                # Pastikan tidak overlap dengan span yang lebih panjang
                is_overlap = any(s <= idx < e or s < end <= e for (s, e) in matched_spans)
                if not is_overlap:
                    matched_spans.append((idx, end))
                    matches.append((canonical_name, cat, idx, end))

            start = idx + len(syn)

    return sorted(matches, key=lambda x: x[2])
