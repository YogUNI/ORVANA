"""
Pipeline Machine Learning & NLP Hibrida:
1. TF-IDF + Multinomial Naive Bayes Classifier untuk mendeteksi intensi kalimat petani
   (OFFER_STOCK, HARVEST_PLAN, PRICE_INQUIRY, IRRELEVANT).
2. Cosine Similarity Fuzzy Matcher untuk mencocokkan komoditas yang tidak baku / typo.
"""

from typing import Any, Dict, List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics.pairwise import cosine_similarity

from app.nlp.commodities import COMMODITY_SYNONYMS
from app.nlp.dataset_generator import generate_training_dataset
from app.nlp.feedback_loop import feedback_manager
from app.nlp.model_persistence import persistence_manager
from app.nlp.preprocessor import normalize_slang_and_dialect
from app.nlp.evaluation import evaluate_classifier_performance

class HybridNLPClassifier:
    def __init__(self, base_samples: int = 1000):
        self.base_samples = base_samples
        self.metrics: Dict[str, Any] = {}
        
        # 1. Coba muat bobot model tersimpan dari disk jika ada
        loaded = persistence_manager.load_artifacts()
        if loaded:
            self.intent_clf = loaded["intent_clf"]
            self.intent_vectorizer = loaded["intent_vectorizer"]
            self.char_vectorizer = loaded["char_vectorizer"]
            self.synonym_matrix = loaded["synonym_matrix"]
            self.metrics = loaded["metadata"].get("evaluation", {})
            self._init_synonym_mappings()
            print("[INFO] Model NLP berhasil dimuat dari disk (models/).")
        else:
            print("[INFO] Model belum tersimpan di disk. Melatih model baru (1.000 sampel)...")
            self.train_model()

    def _init_synonym_mappings(self):
        self.canonical_names = list(COMMODITY_SYNONYMS.keys())
        self.flat_synonyms: List[Tuple[str, str]] = []
        for canon, (_, syns) in COMMODITY_SYNONYMS.items():
            for s in syns:
                self.flat_synonyms.append((s, canon))

    def train_model(self) -> Dict[str, Any]:
        """
        Melatih model TF-IDF Naive Bayes dengan 1.000 sampel data latih,
        menghitung evaluasi presisi/recall/F1-score, dan menyimpannya ke disk (models/).
        """
        self._init_synonym_mappings()

        # 1. Dataset sintetis 1.000 sampel + feedback riil user
        synthetic_data = generate_training_dataset(target_count=self.base_samples)
        feedback_pairs = feedback_manager.get_additional_training_pairs()
        full_dataset = list(synthetic_data) + feedback_pairs
        
        # Bersihkan slang pada dataset
        processed_dataset = [
            (normalize_slang_and_dialect(text), label) for text, label in full_dataset
        ]
        texts, labels = zip(*processed_dataset)

        # 2. Inisialisasi TF-IDF Feature Extractor
        self.intent_vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            lowercase=True
        )
        X = self.intent_vectorizer.fit_transform(texts)

        # 3. Model Multinomial Naive Bayes
        self.intent_clf = MultinomialNB(alpha=0.15)
        self.intent_clf.fit(X, labels)

        # 4. Evaluasi Enterprise (Stratified 5-Fold, F1, Confusion Matrix)
        eval_results = evaluate_classifier_performance(
            self.intent_clf,
            self.intent_vectorizer,
            processed_dataset
        )
        self.metrics = eval_results

        # 5. Commodity Fuzzy Semantic Vectorizer
        self.char_vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), lowercase=True)
        synonym_texts = [s for s, _ in self.flat_synonyms]
        self.synonym_matrix = self.char_vectorizer.fit_transform(synonym_texts)

        # 6. Simpan artefak model ke disk secara permanen
        meta = {
            "version": "1.2.0",
            "totalSamples": len(full_dataset),
            "feedbackSamples": len(feedback_pairs),
            "evaluation": eval_results
        }
        persistence_manager.save_artifacts(
            self.intent_clf,
            self.intent_vectorizer,
            self.char_vectorizer,
            self.synonym_matrix,
            meta
        )

        return {
            "totalSamples": len(full_dataset),
            "feedbackSamples": len(feedback_pairs),
            "cvAccuracy": eval_results["meanAccuracy"],
            "macroF1": eval_results["macroF1"],
            "savedToDisk": True
        }

    def predict_intent(self, text: str) -> Tuple[str, float]:
        """
        Prediksi niat kalimat (OFFER_STOCK, HARVEST_PLAN, PRICE_INQUIRY, IRRELEVANT)
        beserta probabilitas keyakinan (confidence score).
        Teks dinormalisasi terlebih dahulu dengan kamus slang lokal.
        """
        clean_text = normalize_slang_and_dialect(text)
        X = self.intent_vectorizer.transform([clean_text])
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
