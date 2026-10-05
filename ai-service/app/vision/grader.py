"""
Modul Computer Vision untuk penilaian mutu kesegaran komoditas dari foto (Modul B - docs/08).
Menganalisis indeks warna (HSV color space), saturasi kesegaran daun/kulit, dan tekstur keutuhan.
"""

import io
from typing import Dict, Tuple
import numpy as np
from PIL import Image
import cv2

def analyze_commodity_quality(image_bytes: bytes, commodity_category: str = "VEGETABLE") -> Dict:
    """
    Menganalisis citra komoditas pangan untuk memberikan usulan skor mutu 0 - 100
    berdasarkan indeks klorofil hijau, kecerahan, dan rasio bintik/kerusakan visual.
    """
    try:
        # Buka gambar dari byte stream
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)
        
        # Konversi ke OpenCV BGR dan HSV
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        
        h, s, v = cv2.split(img_hsv)
        
        # Hitung metrik visual objektif
        avg_saturation = float(np.mean(s))
        avg_brightness = float(np.mean(v))
        
        # 1. Deteksi pigmen kesegaran (misal warna hijau segar untuk sayuran: Hue 35 - 85)
        # Atau warna merah/oranye untuk tomat/wortel/cabai (Hue 0 - 20 & 160 - 180)
        green_mask = cv2.inRange(img_hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
        red_mask_1 = cv2.inRange(img_hsv, np.array([0, 50, 50]), np.array([15, 255, 255]))
        red_mask_2 = cv2.inRange(img_hsv, np.array([165, 50, 50]), np.array([180, 255, 255]))
        red_mask = cv2.bitwise_or(red_mask_1, red_mask_2)
        
        total_pixels = img_hsv.shape[0] * img_hsv.shape[1]
        green_ratio = float(np.count_nonzero(green_mask)) / total_pixels
        red_ratio = float(np.count_nonzero(red_mask)) / total_pixels
        
        # 2. Deteksi bintik gelap / pembusukan / cacat nekrosis (V rendah, S sedang)
        defect_mask = cv2.inRange(img_hsv, np.array([0, 0, 0]), np.array([180, 255, 45]))
        defect_ratio = float(np.count_nonzero(defect_mask)) / total_pixels
        
        # Baseline model skoring (0 - 100)
        base_score = 85.0
        
        if commodity_category == "VEGETABLE":
            # Sayuran segar memiliki saturasi dan dominasi hijau yang seimbang
            if green_ratio > 0.25:
                base_score += 8.0
            elif green_ratio < 0.05:
                base_score -= 15.0
        elif commodity_category in ["SPICE", "FRUIT"]:
            # Tomat / cabai / buah
            if red_ratio > 0.15:
                base_score += 7.0
        
        # Penalti kecacatan visual (bintik busuk / layu gelap)
        defect_penalty = min(35.0, defect_ratio * 120.0)
        final_score = max(30.0, min(98.0, base_score - defect_penalty))
        
        # Kategori label mutu
        if final_score >= 80.0:
            label = "SEGAR_OPTIMAL"
            status_desc = "Tingkat kesegaran prima, warna cerah, minim cacat fisik."
        elif final_score >= 65.0:
            label = "STANDAR_LAYAK"
            status_desc = "Memenuhi ambang batas mutu konsumsi, ada sedikit layu minor."
        else:
            label = "PERLU_SORTIR"
            status_desc = "Terindikasi bintik layu atau pembusukan fisik. Rekomendasi afkir/sortir."
            
        confidence = 0.88 if total_pixels > 50000 else 0.72

        return {
            "aiSuggestedScore": round(final_score, 1),
            "label": label,
            "statusDescription": status_desc,
            "confidence": confidence,
            "metrics": {
                "saturation": round(avg_saturation, 1),
                "brightness": round(avg_brightness, 1),
                "greenRatioPct": round(green_ratio * 100, 1),
                "defectRatioPct": round(defect_ratio * 100, 1),
            }
        }
    except Exception as e:
        return {
            "aiSuggestedScore": 75.0,
            "label": "PERLU_PEMERIKSAAN_MANUAL",
            "statusDescription": f"Analisis visual parsial: {str(e)}",
            "confidence": 0.50,
            "metrics": {}
        }
