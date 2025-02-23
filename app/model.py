import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "sentiment.pkl")

# Load the model and vectorizer at startup
try:
    data = joblib.load(MODEL_PATH)
    model = data['model']
    vectorizer = data['vectorizer']
except Exception as e:
    raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {e}")

def predict_sentiment(text: str) -> str:
    # Transform the input text
    text_vec = vectorizer.transform([text])
    pred = model.predict(text_vec)
    return "positive" if pred[0] == 1 else "negative"

