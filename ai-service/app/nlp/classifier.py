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
from sklearn.model_selection import cross_val_score

from app.nlp.commodities import COMMODITY_SYNONYMS
from app.nlp.dataset_generator import generate_training_dataset
from app.nlp.feedback_loop import feedback_manager

class HybridNLPClassifier:
    def __init__(self, base_samples: int = 600):
        self.base_samples = base_samples
        self.train_model()

    def train_model(self) -> Dict[str, float]:
        """
        Melatih atau melatih ulang model TF-IDF Naive Bayes
        dengan menggabungkan dataset sintetis 600 sampel dan feedback riil pengguna.
        """
        # 1. Hasilkan data latih domain pertanian Indonesia
        synthetic_data = generate_training_dataset(target_count=self.base_samples)
        
        # 2. Gabungkan dengan data feedback aktif dari user nyata
        feedback_pairs = feedback_manager.get_additional_training_pairs()
        full_dataset = list(synthetic_data) + feedback_pairs
        
        texts, labels = zip(*full_dataset)

        # 3. Inisialisasi TF-IDF Feature Extractor (Unigram + Bigram + Sublinear TF Scaling)
        self.intent_vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            lowercase=True
        )
        X = self.intent_vectorizer.fit_transform(texts)

        # 4. Model Multinomial Naive Bayes dengan evaluasi Cross Validation 5-Fold
        self.intent_clf = MultinomialNB(alpha=0.2)
        cv_scores = cross_val_score(self.intent_clf, X, labels, cv=5)
        self.mean_accuracy = float(np.mean(cv_scores))
        self.intent_clf.fit(X, labels)

        # 5. Inisialisasi Commodity Fuzzy Semantic Vectorizer (Character n-grams 2-4 untuk toleransi typo)
        self.char_vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), lowercase=True)
        self.canonical_names = list(COMMODITY_SYNONYMS.keys())
        
        # Flatten corpus sinonim
        self.flat_synonyms: List[Tuple[str, str]] = [] # (synonym, canonical_name)
        for canon, (_, syns) in COMMODITY_SYNONYMS.items():
            for s in syns:
                self.flat_synonyms.append((s, canon))
        
        synonym_texts = [s for s, _ in self.flat_synonyms]
        self.synonym_matrix = self.char_vectorizer.fit_transform(synonym_texts)

        return {
            "totalSamples": len(full_dataset),
            "feedbackSamples": len(feedback_pairs),
            "cvAccuracy": round(self.mean_accuracy * 100, 2)
        }

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
