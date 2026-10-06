"""
Modul Evaluasi Model Machine Learning Enterprise.
Menghasilkan metrik presisi, recall, F1-score per kelas, akurasi cross-validation 5-fold,
serta Confusion Matrix komprehensif untuk pengujian benchmark kualitas model.
"""

from typing import Dict, List, Any
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.model_selection import StratifiedKFold

def evaluate_classifier_performance(
    model: Any,
    vectorizer: Any,
    dataset: List[tuple]
) -> Dict[str, Any]:
    """
    Menghitung evaluasi performa menyeluruh:
    - Akurasi rata-rata
    - Stratified 5-Fold Cross-Validation Scores
    - Precision, Recall, F1-Score per kelas (OFFER_STOCK, HARVEST_PLAN, PRICE_INQUIRY, IRRELEVANT)
    - Confusion Matrix
    """
    texts, labels = zip(*dataset)
    X = vectorizer.transform(texts)
    y = np.array(labels)

    # 1. Stratified K-Fold Cross Validation untuk keseimbangan kelas
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    fold_accuracies = []

    for train_idx, val_idx in skf.split(X, y):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        
        # Clone dan latih fold
        clone_model = type(model)(**model.get_params())
        clone_model.fit(X_train, y_train)
        y_pred_val = clone_model.predict(X_val)
        fold_accuracies.append(accuracy_score(y_val, y_pred_val))

    cv_mean = float(np.mean(fold_accuracies))
    cv_std = float(np.std(fold_accuracies))

    # 2. Prediksi full dataset untuk Classification Report & Confusion Matrix
    y_preds = model.predict(X)
    report = classification_report(y, y_preds, output_dict=True, zero_division=0)
    conf_mat = confusion_matrix(y, y_preds, labels=model.classes_).tolist()

    return {
        "meanAccuracy": round(cv_mean * 100, 2),
        "stdAccuracy": round(cv_std * 100, 2),
        "foldAccuracies": [round(acc * 100, 2) for acc in fold_accuracies],
        "classes": list(model.classes_),
        "classificationReport": report,
        "confusionMatrix": conf_mat,
        "macroF1": round(report.get("macro avg", {}).get("f1-score", 1.0) * 100, 2),
        "weightedF1": round(report.get("weighted avg", {}).get("f1-score", 1.0) * 100, 2),
    }
