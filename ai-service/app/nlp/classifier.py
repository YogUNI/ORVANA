"""
Pipeline Machine Learning & NLP Hibrida:
1. TF-IDF + Multinomial Naive Bayes Classifier untuk mendeteksi intensi kalimat petani
   (OFFER_STOCK, HARVEST_PLAN, PRICE_INQUIRY, IRRELEVANT).
2. Cosine Similarity Fuzzy Matcher untuk mencocokkan komoditas yang tidak baku / typo.
"""

from typing import Dict, List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics.pairwise import cosine_similarity

from app.nlp.commodities import COMMODITY_SYNONYMS

# Dataset latih intensi ucapan petani lokal (Corpus Data)
INTENT_TRAINING_DATA = [
    # OFFER_STOCK: Menawarkan stok yang siap kirim / panen segera
    ("besok panen 200 kg cabai rawit harga 45 ribu", "OFFER_STOCK"),
    ("lusa ada bayam 2 kwintal siap angkut", "OFFER_STOCK"),
    ("kangkung 1 ton minggu depan 7rb", "OFFER_STOCK"),
    ("ada lele 50 kilo tgl 15 harga 30.000", "OFFER_STOCK"),
    ("siap kirim tomat 100 kg dari cibening", "OFFER_STOCK"),
    ("stok telur ayam ready 500 butir atau 30 kilo", "OFFER_STOCK"),
    ("panen raya bawang merah 3 kwintal siap setor dapur", "OFFER_STOCK"),
    ("ada tempe segar bu rina 80 kg baru jadi", "OFFER_STOCK"),
    ("beras ramos 500 kilo siap kirim", "OFFER_STOCK"),
    ("ikan nila 100 kg baru angkat kolam", "OFFER_STOCK"),

    # HARVEST_PLAN: Proyeksi masa depan / tanam baru (belum siap sekarang)
    ("bulan depan baru mau panen padi 2 hektar", "HARVEST_PLAN"),
    ("rencana panen cabai rawit akhir bulan november", "HARVEST_PLAN"),
    ("masih tanam kangkung estimasi panen 20 hari lagi", "HARVEST_PLAN"),
    ("bibit lele baru sebar perkiraan panen 2 bulan", "HARVEST_PLAN"),
    ("jadwal panen wortel masih 3 minggu lagi", "HARVEST_PLAN"),

    # PRICE_INQUIRY: Bertanya harga acuan / pasar
    ("berapa harga cabai rawit hari ini di pasar bogor?", "PRICE_INQUIRY"),
    ("harga dasar gabah kering berapa ya pak?", "PRICE_INQUIRY"),
    ("apakah harga telur ayam naik minggu ini?", "PRICE_INQUIRY"),
    ("cek harga acuan bapanas untuk bawang merah", "PRICE_INQUIRY"),

    # IRRELEVANT / GREETING
    ("selamat pagi pak koordinator", "IRRELEVANT"),
    ("terima kasih infonya", "IRRELEVANT"),
    ("hujan deras di sawah hari ini", "IRRELEVANT"),
    ("halo assalamualaikum", "IRRELEVANT"),
]

class HybridNLPClassifier:
    def __init__(self):
        # 1. Inisialisasi Intent Classifier
        self.intent_vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
        texts, labels = zip(*INTENT_TRAINING_DATA)
        X = self.intent_vectorizer.fit_transform(texts)
        self.intent_clf = MultinomialNB(alpha=0.5)
        self.intent_clf.fit(X, labels)

        # 2. Inisialisasi Commodity Fuzzy Semantic Vectorizer (Character n-grams untuk toleransi typo)
        self.char_vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), lowercase=True)
        self.canonical_names = list(COMMODITY_SYNONYMS.keys())
        
        # Flatten corpus sinonim
        self.flat_synonyms: List[Tuple[str, str]] = [] # (synonym, canonical_name)
        for canon, (_, syns) in COMMODITY_SYNONYMS.items():
            for s in syns:
                self.flat_synonyms.append((s, canon))
        
        synonym_texts = [s for s, _ in self.flat_synonyms]
        self.synonym_matrix = self.char_vectorizer.fit_transform(synonym_texts)

    def predict_intent(self, text: str) -> Tuple[str, float]:
        """
        Prediksi niat kalimat (OFFER_STOCK, HARVEST_PLAN, PRICE_INQUIRY, IRRELEVANT)
        beserta probabilitas keyakinan (confidence score).
        """
        X = self.intent_vectorizer.transform([text])
        probs = self.intent_clf.predict_proba(X)[0]
        max_idx = np.argmax(probs)
        predicted_label = self.intent_clf.classes_[max_idx]
        confidence = float(probs[max_idx])
        return predicted_label, round(confidence, 3)

    def fuzzy_match_commodity(self, word: str, threshold: float = 0.55) -> Tuple[str, float]:
        """
        Mencocokkan kata yang berpotensi salah ketik / typo ke komoditas resmi
        menggunakan Char n-gram Cosine Similarity.
        Contoh: "cbe rwit" -> "Cabai rawit"
        """
        word_vec = self.char_vectorizer.transform([word])
        sims = cosine_similarity(word_vec, self.synonym_matrix)[0]
        best_idx = np.argmax(sims)
        best_score = float(sims[best_idx])

        if best_score >= threshold:
            canonical_name = self.flat_synonyms[best_idx][1]
            return canonical_name, round(best_score, 3)
        return "", 0.0

nlp_engine = HybridNLPClassifier()
