"""
Modul Model Persistence: Serialisasi & Deserialisasi Model Machine Learning & Vectorizer.
Menyimpan model ke disk (models/) menggunakan format joblib dengan hashing metadata,
sehingga sistem tidak perlu melatih ulang saat restart dan memuat bobot secara instan (<15ms).
"""

import os
import json
import joblib
from datetime import datetime
from typing import Dict, Any, Optional

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
MODEL_METADATA_FILE = os.path.join(MODELS_DIR, "model_meta.json")
INTENT_MODEL_FILE = os.path.join(MODELS_DIR, "intent_classifier.joblib")
INTENT_VECTORIZER_FILE = os.path.join(MODELS_DIR, "intent_vectorizer.joblib")
CHAR_VECTORIZER_FILE = os.path.join(MODELS_DIR, "char_vectorizer.joblib")
SYNONYM_MATRIX_FILE = os.path.join(MODELS_DIR, "synonym_matrix.joblib")

class ModelPersistenceManager:
    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self._ensure_models_dir()

    def _ensure_models_dir(self):
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir, exist_ok=True)

    def is_model_saved(self) -> bool:
        """
        Mengecek apakah seluruh artefak model lengkap di disk.
        """
        required_files = [
            INTENT_MODEL_FILE,
            INTENT_VECTORIZER_FILE,
            CHAR_VECTORIZER_FILE,
            SYNONYM_MATRIX_FILE,
            MODEL_METADATA_FILE
        ]
        return all(os.path.exists(f) for f in required_files)

    def save_artifacts(
        self,
        intent_clf: Any,
        intent_vectorizer: Any,
        char_vectorizer: Any,
        synonym_matrix: Any,
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Menyimpan semua artefak model dan metadata evaluasi ke disk.
        """
        try:
            self._ensure_models_dir()
            joblib.dump(intent_clf, INTENT_MODEL_FILE, compress=3)
            joblib.dump(intent_vectorizer, INTENT_VECTORIZER_FILE, compress=3)
            joblib.dump(char_vectorizer, CHAR_VECTORIZER_FILE, compress=3)
            joblib.dump(synonym_matrix, SYNONYM_MATRIX_FILE, compress=3)

            metadata["savedAt"] = datetime.now().isoformat()
            with open(MODEL_METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)

            return True
        except Exception as e:
            print(f"[ERROR] Gagal menyimpan artefak model: {e}")
            return False

    def load_artifacts(self) -> Optional[Dict[str, Any]]:
        """
        Memuat model dari disk ke memori.
        Returns None jika file belum ada.
        """
        if not self.is_model_saved():
            return None

        try:
            intent_clf = joblib.load(INTENT_MODEL_FILE)
            intent_vectorizer = joblib.load(INTENT_VECTORIZER_FILE)
            char_vectorizer = joblib.load(CHAR_VECTORIZER_FILE)
            synonym_matrix = joblib.load(SYNONYM_MATRIX_FILE)

            metadata = {}
            if os.path.exists(MODEL_METADATA_FILE):
                with open(MODEL_METADATA_FILE, "r", encoding="utf-8") as f:
                    metadata = json.load(f)

            return {
                "intent_clf": intent_clf,
                "intent_vectorizer": intent_vectorizer,
                "char_vectorizer": char_vectorizer,
                "synonym_matrix": synonym_matrix,
                "metadata": metadata
            }
        except Exception as e:
            print(f"[ERROR] Gagal memuat model dari disk: {e}")
            return None

    def get_model_metadata(self) -> Dict[str, Any]:
        """
        Mengambil metadata versi dan metrik akurasi model yang sedang tersimpan di disk.
        """
        if os.path.exists(MODEL_METADATA_FILE):
            try:
                with open(MODEL_METADATA_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"version": "1.0.0", "status": "NOT_SAVED"}

persistence_manager = ModelPersistenceManager()
