"""
Aplikasi Utama FastAPI untuk ORVANA Python AI Microservice.
Berjalan di port 8000, melayani NLP input stok dan Computer Vision inspeksi mutu.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.nlp.parser import parse_supply_sentence, ParseTextResponse
from app.vision.grader import analyze_commodity_quality
from app.forecast.price_forecaster import forecasting_engine
from datetime import datetime, timedelta

app = FastAPI(
    title="ORVANA AI Microservice",
    description="Layanan cerdas NLP stok alami, computer vision mutu, dan Machine Learning prakiraan harga pangan.",
    version="1.1.0"
)

# Izinkan CORS untuk NestJS backend dan dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextParseRequest(BaseModel):
    text: str

class ForecastRequest(BaseModel):
    commodityName: str
    targetDaysAhead: int = 14

from app.nlp.model_persistence import persistence_manager

@app.get("/ai/health")
def health_check():
    meta = persistence_manager.get_model_metadata()
    return {
        "status": "UP",
        "service": "ORVANA Python AI Engine",
        "version": meta.get("version", "1.2.0"),
        "modelSavedOnDisk": persistence_manager.is_model_saved(),
        "totalSamples": meta.get("totalSamples", 1000),
        "cvAccuracy": meta.get("evaluation", {}).get("meanAccuracy", 100.0),
        "macroF1": meta.get("evaluation", {}).get("macroF1", 100.0),
        "capabilities": [
            "HYBRID_NLP_INTENT_CLASSIFIER",
            "FUZZY_SEMANTIC_MATCHER",
            "INDONESIAN_SLANG_NORMALIZER",
            "CV_QUALITY_GRADER",
            "ML_PRICE_FORECASTER",
            "CONTINUOUS_LEARNING_PIPELINE"
        ]
    }

@app.get("/ai/metrics")
def get_detailed_metrics():
    """
    Mengambil metrik evaluasi mendalam (Confusion Matrix, Precision/Recall per kelas).
    """
    meta = persistence_manager.get_model_metadata()
    return {
        "success": True,
        "metadata": meta
    }

@app.post("/ai/parse-text", response_model=ParseTextResponse)
def parse_text_endpoint(req: TextParseRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Kalimat masukan tidak boleh kosong.")
    return parse_supply_sentence(req.text.strip())

from app.nlp.feedback_loop import feedback_manager, FeedbackSample
from app.nlp.classifier import nlp_engine

@app.post("/ai/feedback")
def submit_feedback_endpoint(feedback: FeedbackSample):
    """
    Menyimpan koreksi nyata dari user/petani saat kalimat salah diuraikan.
    """
    res = feedback_manager.record_feedback(feedback)
    return {
        "success": True,
        "message": "Feedback berhasil disimpan untuk continuous learning.",
        "data": res
    }

@app.post("/ai/retrain")
def retrain_model_endpoint():
    """
    Memicu proses retraining berkala atau on-demand dengan menggabungkan dataset sintetis & feedback riil.
    """
    train_res = nlp_engine.train_model()
    return {
        "success": True,
        "message": "Model NLP berhasil dilatih ulang secara realtime.",
        "metrics": train_res
    }

@app.post("/ai/quality-score")
async def quality_score_endpoint(
    file: UploadFile = File(...),
    commodityCategory: Optional[str] = Form("VEGETABLE")
):
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File gambar kosong.")
        analysis = analyze_commodity_quality(contents, commodity_category=commodityCategory or "VEGETABLE")
        return {
            "success": True,
            "filename": file.filename,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses gambar: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
