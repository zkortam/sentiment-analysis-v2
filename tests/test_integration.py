import requests

BASE_URL = "http://localhost:80"

def test_root():
    resp = requests.get(f"{BASE_URL}/")
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data

def test_positive_sentiment():
    payload = {"text": "I love this product"}
    resp = requests.post(f"{BASE_URL}/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("sentiment") == "positive"

def test_negative_sentiment():
    payload = {"text": "I hate this service"}
    resp = requests.post(f"{BASE_URL}/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("sentiment") == "negative"

if __name__ == "__main__":
    test_root()
    test_positive_sentiment()
    test_negative_sentiment()
    print("All integration tests passed!")
