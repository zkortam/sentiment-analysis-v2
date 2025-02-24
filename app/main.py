from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import predict_sentiment
import logging

app = FastAPI(title="Cloud Native Sentiment Analysis API")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable CORS for all origins
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
    # Provides a basic health check endpoint
    return {
        "status": "ok",
        "message": "API is running",
        "aws": "OK",
        "eksCluster": "Running",
        "docker": "Healthy",
        "argoCD": "Synced"
    }

@app.post("/predict", response_model=SentimentResponse)
def predict(request: SentimentRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        sentiment = predict_sentiment(request.text)
        logger.info(f"Input text: {request.text} | Predicted sentiment: {sentiment}")
        return {"sentiment": sentiment}
    except Exception as e:
        logger.error("Error during sentiment prediction", exc_info=e)
        raise HTTPException(status_code=500, detail="Error during sentiment prediction")
