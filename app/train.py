import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
import joblib

# Dummy dataset
data = {
    'text': [
        "I love this product",
        "This is terrible",
        "Amazing experience",
        "I hate it",
        "Best ever",
        "Worst purchase",
    ],
    'sentiment': [1, 0, 1, 0, 1, 0]  # 1 = positive, 0 = negative
}

df = pd.DataFrame(data)

# Simple text vectorization
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(df['text'])

# Train logistic regression model
X_train, X_test, y_train, y_test = train_test_split(X, df['sentiment'], test_size=0.33, random_state=42)
model = LogisticRegression()
model.fit(X_train, y_train)

# Save both the model and the vectorizer
joblib.dump({'model': model, 'vectorizer': vectorizer}, 'sentiment.pkl')

print("Model trained and saved as sentiment.pkl")
