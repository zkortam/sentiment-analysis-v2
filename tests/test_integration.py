import requests

# Replace BASE_URL with your current API endpoint.
BASE_URL = "http://acb0be7bd92a148e1a464121365cd6a1-150769251.us-east-2.elb.amazonaws.com"

def test_status():
    response = requests.get(f"{BASE_URL}/status")
    assert response.status_code == 200, f"Status endpoint returned {response.status_code}"
    data = response.json()
    assert data.get("status") == "ok", f"Unexpected status response: {data}"

def test_predict_positive():
    response = requests.post(
        f"{BASE_URL}/predict",
        json={"text": "I love this product"}
    )
    assert response.status_code == 200, f"Predict endpoint returned {response.status_code}"
    data = response.json()
    assert data.get("sentiment") == "positive", f"Expected positive sentiment, got: {data.get('sentiment')}"

def test_predict_negative():
    response = requests.post(
        f"{BASE_URL}/predict",
        json={"text": "I hate this product"}
    )
    assert response.status_code == 200, f"Predict endpoint returned {response.status_code}"
    data = response.json()
    assert data.get("sentiment") == "negative", f"Expected negative sentiment, got: {data.get('sentiment')}"
