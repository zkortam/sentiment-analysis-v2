from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import predict_sentiment

app = FastAPI(title="Cloud Native Sentiment Analysis API")

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Cloud Native Sentiment Analysis API"}

@app.get("/status")
def get_status():
    # In a real implementation, you would fetch real status data.
    # For demo purposes, we return simulated status.
    return {
        "aws": "OK",
        "eksCluster": "Running",
        "docker": "Healthy",
        "argoCD": "Synced"
    }

@app.post("/predict", response_model=SentimentResponse)
def predict(request: SentimentRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is required")
    sentiment = predict_sentiment(request.text)
    return {"sentiment": sentiment}
