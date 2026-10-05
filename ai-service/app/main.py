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

app = FastAPI(
    title="ORVANA AI Microservice",
    description="Layanan cerdas NLP stok alami, computer vision mutu, dan sinkronisasi harga pangan lokal.",
    version="1.0.0"
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

@app.get("/ai/health")
def health_check():
    return {
        "status": "UP",
        "service": "ORVANA Python AI Engine",
        "version": "1.0.0",
        "capabilities": ["NLP_SUPPLY_PARSER", "CV_QUALITY_GRADER", "BAPANAS_DATA_ENGINE"]
    }

@app.post("/ai/parse-text", response_model=ParseTextResponse)
def parse_text_endpoint(req: TextParseRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Kalimat masukan tidak boleh kosong.")
    return parse_supply_sentence(req.text.strip())

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
