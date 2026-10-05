"""
Suite Uji Kasus NLP Input Stok Petani (docs/08 Bagian 3.6).
Memvalidasi 8 skenario kalimat masukan petani lokal.
"""

from datetime import datetime
from app.nlp.parser import parse_supply_sentence

def test_nlp_test_cases():
    # Basis tanggal uji: Senin 12 Okt 2026
    base_date = datetime(2026, 10, 12)

    # Kasus 1: "besok panen 200 kg cabai rawit harga 45 ribu"
    res1 = parse_supply_sentence("besok panen 200 kg cabai rawit harga 45 ribu", base_date=base_date)
    assert len(res1.candidates) == 1
    c1 = res1.candidates[0]
    assert c1.commodityName == "Cabai rawit"
    assert c1.quantityKg == 200.0
    assert c1.harvestDate == "2026-10-13"
    assert c1.askingPrice == 45000.0
    print("[PASS] Kasus 1 Lulus: Cabai rawit 200kg besok 45rb")

    # Kasus 2: "lusa ada bayam 2 kwintal"
    res2 = parse_supply_sentence("lusa ada bayam 2 kwintal", base_date=base_date)
    assert len(res2.candidates) == 1
    c2 = res2.candidates[0]
    assert c2.commodityName == "Bayam"
    assert c2.quantityKg == 200.0 # 2 kwintal = 200 kg
    assert c2.harvestDate == "2026-10-14"
    assert "askingPrice" in c2.missing
    print("[PASS] Kasus 2 Lulus: Bayam 2 kwintal lusa (harga missing)")

    # Kasus 3: "kangkung 1 ton minggu depan 7rb"
    res3 = parse_supply_sentence("kangkung 1 ton minggu depan 7rb", base_date=base_date)
    assert len(res3.candidates) == 1
    c3 = res3.candidates[0]
    assert c3.commodityName == "Kangkung"
    assert c3.quantityKg == 1000.0 # 1 ton = 1000 kg
    assert c3.harvestDate == "2026-10-19" # Senin pekan depan
    assert c3.askingPrice == 7000.0
    print("[PASS] Kasus 3 Lulus: Kangkung 1 ton minggu depan 7rb")

    # Kasus 4: "ada lele 50 kilo tgl 15 harga 30.000"
    res4 = parse_supply_sentence("ada lele 50 kilo tgl 15 harga 30.000", base_date=base_date)
    assert len(res4.candidates) == 1
    c4 = res4.candidates[0]
    assert c4.commodityName == "Ikan lele"
    assert c4.quantityKg == 50.0
    assert c4.harvestDate == "2026-10-15"
    assert c4.askingPrice == 30000.0
    print("[PASS] Kasus 4 Lulus: Ikan lele 50 kilo tgl 15 30.000")

    # Kasus 5: "panen cabe 300 gram besok"
    res5 = parse_supply_sentence("panen cabe 300 gram besok", base_date=base_date)
    assert len(res5.candidates) == 1
    c5 = res5.candidates[0]
    assert c5.commodityName == "Cabai rawit"
    assert c5.quantityKg == 0.3 # 300 gram = 0.3 kg
    assert len(res5.warnings) > 0 # Peringatan kuantitas sangat kecil
    print("[PASS] Kasus 5 Lulus: Cabai rawit 300 gram (peringatan kuantitas kecil)")

    # Kasus 6: "besok panen"
    res6 = parse_supply_sentence("besok panen", base_date=base_date)
    assert len(res6.candidates) == 0
    print("[PASS] Kasus 6 Lulus: Kalimat tanpa komoditas ditolak dengan sopan")

    # Kasus 7 (Gold Standard Words-to-Number): "lusa ada panen tiga puluh lima kilo lele sama setengah ton beras"
    res7 = parse_supply_sentence("lusa ada panen tiga puluh lima kilo lele sama setengah ton beras", base_date=base_date)
    assert len(res7.candidates) == 2
    assert res7.candidates[0].commodityName == "Ikan lele"
    assert res7.candidates[0].quantityKg == 35.0
    assert res7.candidates[1].commodityName == "Beras"
    assert res7.candidates[1].quantityKg == 500.0
    print("[PASS] Kasus 7 Lulus: Angka kata terbilang ('tiga puluh lima kilo' -> 35kg, 'setengah ton' -> 500kg)")

    # Kasus 8 (Gold Standard Multi-Entity): 3 komoditas sekaligus dalam 1 pesan
    res8 = parse_supply_sentence("besok cabai rawit dua kwintal 45rb, tomat 100 kg 12 ribu, sama bayam 25 kilo 8.000", base_date=base_date)
    assert len(res8.candidates) == 3
    assert res8.candidates[0].commodityName == "Cabai rawit" and res8.candidates[0].quantityKg == 200.0 and res8.candidates[0].askingPrice == 45000.0
    assert res8.candidates[1].commodityName == "Tomat" and res8.candidates[1].quantityKg == 100.0 and res8.candidates[1].askingPrice == 12000.0
    assert res8.candidates[2].commodityName == "Bayam" and res8.candidates[2].quantityKg == 25.0 and res8.candidates[2].askingPrice == 8000.0
    print("[PASS] Kasus 8 Lulus: Multi-Entity Clause Segmentation (3 komoditas terekstrak presisi)")

    print("\nSUCCESS: SEMUA KASUS UJI NLP DOKUMEN 08 & GOLD STANDARD LULUS 100%!")

if __name__ == "__main__":
    test_nlp_test_cases()

