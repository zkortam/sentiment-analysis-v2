from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import predict_sentiment

app = FastAPI(title="Cloud Native Sentiment Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Cloud Native Sentiment Analysis API"}

@app.get("/status")
def get_status():
    return {"aws": "OK", "eksCluster": "Running", "docker": "Healthy", "argoCD": "Synced"}

@app.post("/predict", response_model=SentimentResponse)
def predict(request: SentimentRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is required")
    sentiment = predict_sentiment(request.text)
    return {"sentiment": sentiment}
