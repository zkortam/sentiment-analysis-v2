import joblib
import os
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "sentiment.pkl")

try:
    data = joblib.load(MODEL_PATH)
    model = data['model']
    vectorizer = data['vectorizer']
    logger.info("Model and vectorizer loaded successfully.")
except Exception as e:
    logger.error("Failed to load model", exc_info=e)
    raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {e}")

def predict_sentiment(text: str) -> str:
    text_vec = vectorizer.transform([text])
    pred = model.predict(text_vec)
    logger.debug(f"Transformed text vector: {text_vec} | Raw prediction: {pred}")
    return "positive" if pred[0] == 1 else "negative"
