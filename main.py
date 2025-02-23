from fastapi import FastAPI
import pickle
from pydantic import BaseModel

app = FastAPI()

# Load pre-trained model and vectorizer (make sure you trained and saved these first)
with open("model.pkl", "rb") as f:
    model = pickle.load(f)
with open("vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

# Define request body format
class SentimentRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Sentiment Analysis API!"}

@app.post("/predict")
def predict_sentiment(request: SentimentRequest):
    # Transform input text
    text_vectorized = vectorizer.transform([request.text])
    
    # Predict sentiment
    prediction = model.predict(text_vectorized)
    sentiment = "Positive" if prediction[0] == 1 else "Negative"
    
    return {"text": request.text, "sentiment": sentiment}
