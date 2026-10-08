"""
Generator dataset sintetis domain-specific berstandar industri (Corpus Builder).
Menghasilkan 500-600 sampel data latih NLP teks petani lokal Indonesia
dengan variasi dialek, typo, kombinasi satuan, waktu, harga, dan intensi.
"""

import random
from typing import List, Tuple

# Komoditas dan variasi penyebutan
COMMODITY_VARIANTS = [
    ("Cabai rawit", ["cabai rawit", "cabe rawit", "cabai", "cabe", "lombok rawit", "rawit", "cengek", "cbe rwit", "cabe merah", "cbe"]),
    ("Bawang merah", ["bawang merah", "bawang", "brambang", "bawmer", "bwg merah", "bawang mrh", "bwang merah"]),
    ("Bayam", ["bayam", "bayem", "bayam hijau", "bayam cabut", "byam", "bayam merah"]),
    ("Kangkung", ["kangkung", "kangkong", "kangkung darat", "kangkung air", "kngkung"]),
    ("Wortel", ["wortel", "karot", "wortel lokal", "wrtel", "wortel manis"]),
    ("Tomat", ["tomat", "tomt", "tomat merah", "tomat buah", "tomat sayur", "tmat", "tomaat"]),
    ("Ikan lele", ["ikan lele", "lele", "lele sangkuriang", "lele dumbo", "ikn lele", "bibit lele"]),
    ("Ikan nila", ["ikan nila", "nila", "nilem", "nila merah", "nila hitam", "ikn nila"]),
    ("Telur ayam", ["telur ayam", "telor ayam", "telur", "telor", "endog", "tlur ayam", "tlur", "telor negeri"]),
    ("Ayam potong", ["ayam potong", "ayam", "broiler", "ayam sayur", "daging ayam", "aym potong", "aym"]),
    ("Tempe", ["tempe", "tempeh", "tempe kedelai", "tempe daun", "tempe papan"]),
    ("Tahu", ["tahu", "tahu putih", "tahu kuning", "tahu sutra", "tofu"]),
    ("Beras", ["beras", "beras putih", "beras pandan wangi", "beras setra ramos", "bras", "beras lokal"]),
    ("Kentang", ["kentang", "kntang", "kentang dieng", "potato"]),
    ("Jagung", ["jagung", "jgung", "jagung manis", "jagung pipil"]),
    ("Pisang", ["pisang", "gedang", "pisang ambon", "pisang cavendish", "pisang raja", "psang"]),
]

QUANTITY_SAMPLES = [
    (10, "kg"), (25, "kilo"), (50, "kg"), (100, "kilo"), (150, "kg"), (200, "kg"),
    (2, "kwintal"), (3, "kuintal"), (5, "kw"), (1, "ton"), (2, "ton"), (500, "gram"), (300, "ons")
]

DATE_SAMPLES = [
    "hari ini", "besok", "lusa", "minggu depan", "pekan depan", "senin depan",
    "tgl 15", "tanggal 10", "tgl 20", "tgl 25", "akhir pekan", "tgl 5 bulan depan"
]

PRICE_SAMPLES = [
    "harga 7 ribu", "harga 8rb", "10.000 per kilo", "12 ribu", "harga 15.000",
    "20 ribu", "25rb", "30.000/kg", "harga 35 ribu", "45 ribu", "45rb", "50.000",
    "harga 28 ribu", "harga 38.000", "harga 14 ribu"
]

STOCK_TEMPLATES = [
    "{date} panen {qty} {unit} {comm} {price}",
    "{date} ada {comm} {qty} {unit} siap kirim ke dapur {price}",
    "siap setor {comm} {qty} {unit} {date} {price}",
    "stok {comm} ready {qty} {unit} {date} {price}",
    "ada pasokan {comm} {qty} {unit} {price} angkut {date}",
    "hasil panen {comm} sebanyak {qty} {unit} {date} {price}",
    "petik {comm} {qty} {unit} {date} mau lepas {price}",
    "kebun kami siap kirim {comm} {qty} {unit} {price} {date}",
    "bisa suplai {comm} {qty} {unit} {date} penawaran {price}",
    "timbangan {comm} ada {qty} {unit} {date} {price}",
    "panen raya {comm} {qty} {unit} tanggal panen {date} {price}",
    "sedia {comm} segar {qty} {unit} {date} banderol {price}",
    # Tambahan pola percakapan santai sehari-hari petani / WA chat
    "saya ada barang {comm} bebas harga berapa aja",
    "saya ada {comm} sama {comm2} monggo diangkut",
    "ada barang {comm} segar di kebun barangkali dapur butuh",
    "sy ada pasokan {comm} dan {comm2} siap diambil bos",
    "ada {comm} {qty} {unit} dan {comm2} {qty2} {unit2} {price}",
    "panen {comm} melimpah hari ini harga santai",
    "stok {comm} banyak di gudang silahkan cek dapur",
    "kita ada barang {comm} fresh petik pagi ini",
]

PLAN_TEMPLATES = [
    "perkiraan panen {comm} masih {date}",
    "rencana panen {comm} sekitar {qty} {unit} di {date}",
    "masih proses tanam {comm} estimasi panen {date}",
    "jadwal panen raya {comm} diproyeksikan {date}",
    "proyeksi hasil panen {comm} sekitar {qty} {unit} bulan depan",
    "tanam {comm} baru mulai, target panen {date}",
    "kalender tanam {comm} siap petik {date}",
    "bibit {comm} baru tebar estimasi panen {date}",
]

INQUIRY_TEMPLATES = [
    "berapa harga acuan {comm} hari ini di dapur?",
    "cek standar harga pasar bapanas untuk {comm}",
    "apakah harga {comm} di bogor sedang naik?",
    "berapa pagu maksimal pembelian {comm} minggu ini?",
    "mohon info harga dasar petani untuk {comm}",
    "tolong update harga pasar {comm} saat ini",
    "berapa harga serap dapur gizi untuk {comm}?",
]

IRRELEVANT_TEMPLATES = [
    "selamat pagi bapak ibu pengurus dapur",
    "terima kasih atas kerjasama pengiriman kemarin",
    "cuaca di kebun sedang hujan lebat dari subuh",
    "apakah rapat koordinasi kelompok tani jadi diadakan?",
    "mohon info nomor kontak koordinator logistik wilayah",
    "salam sejahtera dari gapoktan sukamaju",
    "kendaraan pikap sedang servis di bengkel",
    "sudah selesai timbang di gudang desa",
    "assalamualaikum wr wb bapak pembina dinas",
    "alhamdulillah pembayaran kemarin sudah masuk rekening",
    "jalan menuju lokasi kebun sedang ada perbaikan aspal",
    "siap menunggu arahan selanjutnya dari dinas",
]

def generate_training_dataset(target_count: int = 550) -> List[Tuple[str, str]]:
    """
    Menghasilkan dataset seimbang ~550 kalimat teks beranotasi.
    """
    random.seed(42)
    dataset: List[Tuple[str, str]] = []

    # 1. Generate OFFER_STOCK (~500 sampel)
    for _ in range(500):
        _, comm_variants = random.choice(COMMODITY_VARIANTS)
        comm = random.choice(comm_variants)
        _, comm_variants2 = random.choice(COMMODITY_VARIANTS)
        comm2 = random.choice(comm_variants2)
        qty, unit = random.choice(QUANTITY_SAMPLES)
        qty2, unit2 = random.choice(QUANTITY_SAMPLES)
        date = random.choice(DATE_SAMPLES)
        price = random.choice(PRICE_SAMPLES) if random.random() > 0.15 else "" # 15% tanpa harga
        tmpl = random.choice(STOCK_TEMPLATES)
        
        format_kwargs = {
            "date": date, "qty": qty, "unit": unit, "comm": comm, "price": price,
            "comm2": comm2, "qty2": qty2, "unit2": unit2
        }
        # Format template dengan parameter yang tersedia
        text = tmpl
        for k, v in format_kwargs.items():
            text = text.replace(f"{{{k}}}", str(v))
        text = " ".join(text.split()).strip()
        dataset.append((text, "OFFER_STOCK"))

    # 2. Generate HARVEST_PLAN / DEMAND_REQUEST (~250 sampel)
    for _ in range(250):
        _, comm_variants = random.choice(COMMODITY_VARIANTS)
        comm = random.choice(comm_variants)
        qty, unit = random.choice(QUANTITY_SAMPLES)
        date = random.choice(DATE_SAMPLES)
        tmpl = random.choice(PLAN_TEMPLATES)
        text = tmpl.format(date=date, qty=qty, unit=unit, comm=comm).strip()
        text = " ".join(text.split())
        dataset.append((text, "HARVEST_PLAN"))

    # 3. Generate PRICE_INQUIRY (~130 sampel)
    for _ in range(130):
        _, comm_variants = random.choice(COMMODITY_VARIANTS)
        comm = random.choice(comm_variants)
        tmpl = random.choice(INQUIRY_TEMPLATES)
        text = tmpl.format(comm=comm).strip()
        dataset.append((text, "PRICE_INQUIRY"))

    # 4. Generate IRRELEVANT (~120 sampel)
    for _ in range(120):
        text = random.choice(IRRELEVANT_TEMPLATES)
        dataset.append((text, "IRRELEVANT"))

    random.shuffle(dataset)
    return dataset[:target_count]

if __name__ == "__main__":
    data = generate_training_dataset(1000)
    print(f"Dataset berhasil digenerate: {len(data)} sampel data latih.")
    from collections import Counter
    counts = Counter(label for _, label in data)
    print("Distribusi Kelas:", counts)

