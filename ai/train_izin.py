"""Melatih model klasifikasi alasan izin (offline) untuk aplikasi.

Keluaran: model-izin.json, dibaca oleh sentiment.js (format sama dengan model-edom.json).
Kategori mengikuti PermitCategory di src/types/domain.ts:
sakit | acara-kampus | keluarga | lainnya.

Jalankan dari folder ai/:
    python -m pip install -r requirements.txt
    python train_izin.py

Menambah data: tambahkan baris `text,label` ke data/alasan-izin.csv lalu jalankan ulang.
Data uji (data/alasan-izin-uji.csv) TIDAK dipakai untuk melatih; hanya untuk melaporkan akurasi.
"""
import csv
import json
import math
import re
import unicodedata
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix

HERE = Path(__file__).parent
TRAIN_CSV = HERE / "data" / "alasan-izin.csv"
TEST_CSV = HERE / "data" / "alasan-izin-uji.csv"
OUT_JSON = HERE / "model-izin.json"

LABELS = ["acara-kampus", "keluarga", "lainnya", "sakit"]  # urut alfabet (classes_ sklearn)
PREPROCESSING = "unicode_nfkd_ascii_words_unigram_bigram_sublinear_tf_l2_v1"
ALIASES = {"gak": "tidak", "nggak": "tidak", "ga": "tidak", "gk": "tidak", "enggak": "tidak",
           "tdk": "tidak", "yg": "yang", "dr": "dari", "krn": "karena", "utk": "untuk",
           "dgn": "dengan", "sy": "saya"}  # hanya alias satu kata, agar identik dengan sentiment.js


def normalize(text: str) -> str:
    """Harus identik dengan normalisasi di sentiment.js (preprocessing unicode_...)."""
    text = re.sub(r"<[^>]*>", " ", text)
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[\u0300-\u036f]", "", text)
    return text.lower()


def analyzer(text: str):
    words = [ALIASES.get(w, w) for w in re.findall(r"[a-z0-9]+", normalize(text))]
    return words + [words[i] + " " + words[i + 1] for i in range(len(words) - 1)]


def read_csv(path: Path):
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [r["text"] for r in rows], [r["label"] for r in rows]


def main():
    x_train, y_train = read_csv(TRAIN_CSV)
    x_test, y_test = read_csv(TEST_CSV)

    vec = TfidfVectorizer(analyzer=analyzer, sublinear_tf=True, norm="l2", max_features=3000)
    xt = vec.fit_transform(x_train)
    clf = LogisticRegression(C=10, max_iter=2000, class_weight="balanced")
    clf.fit(xt, y_train)
    assert list(clf.classes_) == LABELS, clf.classes_

    pred = clf.predict(vec.transform(x_test))
    print("Akurasi pada data uji terpisah:", round(float((np.array(pred) == np.array(y_test)).mean()), 3))
    print(classification_report(y_test, pred, digits=3))
    print(confusion_matrix(y_test, pred, labels=LABELS))

    vocab = {term: int(i) for term, i in vec.vocabulary_.items()}
    model = {
        "schema_version": 1,
        "status": "starter_synthetic_permit_reasons_not_validated_on_real_data",
        "algorithm": "LogisticRegression",
        "labels": LABELS,
        "aliases": ALIASES,
        "vocabulary": vocab,
        "idf": [round(float(v), 6) for v in vec.idf_],
        "weights": [[round(float(v), 6) for v in row] for row in clf.coef_],
        "bias": [round(float(v), 6) for v in clf.intercept_],
        "preprocessing": PREPROCESSING,
        "training_data": f"{len(x_train)} contoh alasan izin buatan tim (data/alasan-izin.csv)",
    }
    OUT_JSON.write_text(json.dumps(model, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Tersimpan: {OUT_JSON.name} ({OUT_JSON.stat().st_size / 1024:.0f} KiB, {len(vocab)} fitur)")


if __name__ == "__main__":
    main()
