"""
Modul Feedback Loop & Continuous Training NLP (docs/08 AI Modules).
Menyimpan riwayat koreksi kalimat pengguna, dataset feedback,
dan melakukan re-training (retrain) model secara adaptif tanpa downtime.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

FEEDBACK_DATASET_FILE = os.path.join(os.path.dirname(__file__), "feedback_dataset.json")

class FeedbackSample(BaseModel):
    rawText: str
    correctedIntent: str
    correctedCommodities: List[Dict[str, Any]] # [{"name": "Cabai rawit", "quantityKg": 200, "price": 45000}]
    notes: Optional[str] = None
    timestamp: Optional[str] = None

class ContinuousLearningManager:
    """
    Mengelola siklus hidup data pembelajaran mesin (Active Learning / Feedback Loop).
    Menampung input nyata dari pengguna saat terjadi kesalahan parsing atau koreksi manual di UI.
    """
    def __init__(self, filepath: str = FEEDBACK_DATASET_FILE):
        self.filepath = filepath
        self._ensure_dataset_file()

    def _ensure_dataset_file(self):
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2, ensure_ascii=False)

    def load_feedback(self) -> List[Dict]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def record_feedback(self, sample: FeedbackSample) -> Dict:
        """
        Menyimpan koreksi pengguna ke dataset feedback permanen.
        """
        records = self.load_feedback()
        entry = sample.dict()
        if not entry.get("timestamp"):
            entry["timestamp"] = datetime.now().isoformat()
        records.append(entry)
        
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)

        return {
            "status": "RECORDED",
            "totalFeedbackCount": len(records),
            "sample": entry
        }

    def get_additional_training_pairs(self) -> List[tuple]:
        """
        Mengonversi feedback pengguna menjadi pasangan (text, intent) untuk training lanjutan.
        """
        records = self.load_feedback()
        pairs = []
        for r in records:
            text = r.get("rawText", "").strip()
            intent = r.get("correctedIntent", "").strip()
            if text and intent:
                pairs.append((text, intent))
        return pairs

feedback_manager = ContinuousLearningManager()
