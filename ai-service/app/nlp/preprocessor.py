"""
Modul Normalisasi Teks Bahasa Indonesia, Kamus Slang/Dialek Petani, dan Preprocessing Teks.
Membakukan singkatan SMS/WhatsApp, istilah slang pasar, dan fonetik lokal (Sunda/Jawa)
sebelum diproses oleh TF-IDF Vectorizer dan Entity Extractor.
"""

import re
from typing import List, Dict

# Kamus pemetaan kata gaul, singkatan SMS/WA, dan istilah pasar lokal
SLANG_LEXICON: Dict[str, str] = {
    # Singkatan umum
    "sy": "saya",
    "gw": "saya",
    "gue": "saya",
    "kuring": "saya",
    "aku": "saya",
    "bsoq": "besok",
    "bsk": "besok",
    "esok": "besok",
    "bessok": "besok",
    "lusa": "lusa",
    "lusa2": "lusa",
    "ad": "ada",
    "uda": "sudah",
    "udh": "sudah",
    "sdh": "sudah",
    "dah": "sudah",
    "blm": "belum",
    "blom": "belum",
    "belom": "belum",
    "tdk": "tidak",
    "ga": "tidak",
    "gak": "tidak",
    "ngga": "tidak",
    "nggak": "tidak",
    "ndak": "tidak",
    "g": "tidak",
    "dgn": "dengan",
    "sama": "sama",
    "sm": "sama",
    "dg": "dengan",
    "utk": "untuk",
    "buat": "untuk",
    "bt": "untuk",
    "bwt": "untuk",
    "kpd": "kepada",
    "dr": "dari",
    "dri": "dari",
    "krn": "karena",
    "karna": "karena",
    "jd": "jadi",
    "jdi": "jadi",
    "msh": "masih",
    "masi": "masih",
    "bisa": "bisa",
    "bs": "bisa",
    "bso": "bisa",
    "bener": "benar",
    "bnr": "benar",
    "bgt": "banget",
    "bgtu": "begitu",
    "bgitu": "begitu",
    "gini": "begini",
    "gni": "begini",
    
    # Istilah aktivitas pertanian & pasar
    "pnn": "panen",
    "panenn": "panen",
    "petik": "panen",
    "metiknya": "panen",
    "metek": "panen",
    "mutik": "panen",
    "stok": "stok",
    "stoknya": "stok",
    "pasokan": "stok",
    "ready": "siap",
    "rdy": "siap",
    "siap": "siap",
    "kirim": "kirim",
    "krm": "kirim",
    "ngirim": "kirim",
    "setor": "setor",
    "nyetor": "setor",
    "angkut": "kirim",
    "diangkut": "kirim",
    "bawa": "kirim",
    "anter": "kirim",
    "antar": "kirim",
    "nganter": "kirim",
    "muat": "kirim",
    "dapur": "dapur",
    "dpr": "dapur",
    "posko": "koordinator",
    "gudang": "koordinator",
    
    # Satuan & istilah timbangan
    "kilo": "kg",
    "kiloan": "kg",
    "kl": "kg",
    "klo": "kg",
    "kilogram": "kg",
    "kw": "kwintal",
    "kuintal": "kwintal",
    "kwintalan": "kwintal",
    "tonn": "ton",
    "gramm": "gram",
    "gr": "gram",
    "ons": "ons",
    
    # Harga & Rupiah
    "hrg": "harga",
    "hrga": "harga",
    "harganya": "harga",
    "rp": "rp",
    "rupiah": "rp",
    "rebu": "ribu",
    "rebuu": "ribu",
    "rb": "ribu",
    "rbu": "ribu",
    "k": "ribu",
    
    # Komoditas slang / dialek lokal
    "cengek": "cabai rawit",
    "cabe": "cabai",
    "cbe": "cabai",
    "rwit": "rawit",
    "lombok": "cabai",
    "brambang": "bawang merah",
    "bawmer": "bawang merah",
    "baput": "bawang putih",
    "endog": "telur ayam",
    "telor": "telur",
    "byam": "bayam",
    "bayem": "bayam",
    "kngkung": "kangkung",
    "kangkong": "kangkung",
    "wrtel": "wortel",
    "karot": "wortel",
    "tmat": "tomat",
    "lele": "ikan lele",
    "nila": "ikan nila",
    "broiler": "ayam potong",
    "bras": "beras",
    "gedang": "pisang",
}

# Stopwords ringan yang tidak boleh menghilangkan kata kunci penting kuantitas/waktu/negasi
LIGHT_STOPWORDS = {
    "yang", "di", "ke", "ini", "itu", "nya", "sih", "dong", "kan", "deh", "ya", "yah", "pak", "bu",
    "mas", "mbak", "juragan", "bos", "kang", "mang", "halo", "assalamualaikum", "selamat", "pagi",
    "siang", "sore", "malam", "terima", "kasih", "makasih", "nuhun", "matur", "suwun"
}

def clean_repeated_characters(word: str) -> str:
    """
    Menghapus repetisi karakter berlebihan akibat pengetikan emosional/cepat di chat.
    Contoh: "cabbbeeee" -> "cabe", "panennnn" -> "panen", "45rbbooo" -> "45rb"
    """
    if len(word) <= 2:
        return word
    # Ganti 3 karakter berturut-turut menjadi maksimal 1
    return re.sub(r'(.)\1{2,}', r'\1', word)

def normalize_slang_and_dialect(text: str) -> str:
    """
    Membersihkan dan membakukan seluruh kosakata slang/daerah ke bentuk bahasa Indonesia baku.
    """
    # 1. Bersihkan karakter aneh kecuali tanda baca esensial (angka, huruf, koma, titik)
    cleaned = re.sub(r'[^\w\s.,/\-]', ' ', text, flags=re.UNICODE)
    cleaned = " ".join(cleaned.split())

    tokens = cleaned.split()
    normalized_tokens: List[str] = []

    for t in tokens:
        lower_t = t.lower()
        # Bersihkan pengulangan huruf (misal: "banyaaakk" -> "banyak")
        dedup_t = clean_repeated_characters(lower_t)
        
        # Cek kamus slang
        if dedup_t in SLANG_LEXICON:
            normalized_tokens.append(SLANG_LEXICON[dedup_t])
        elif lower_t in SLANG_LEXICON:
            normalized_tokens.append(SLANG_LEXICON[lower_t])
        else:
            normalized_tokens.append(t)

    return " ".join(normalized_tokens)

def tokenize_for_nlp(text: str, remove_stopwords: bool = False) -> List[str]:
    """
    Tokenisasi teks yang telah dibersihkan menjadi daftar token kata.
    """
    cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
    tokens = [w for w in cleaned.split() if len(w) > 1]
    if remove_stopwords:
        tokens = [w for w in tokens if w not in LIGHT_STOPWORDS]
    return tokens
