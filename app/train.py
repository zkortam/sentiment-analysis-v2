import pandas as pd
import numpy as np
import random
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib

random.seed(42)
np.random.seed(42)

# Define positive and negative sentence templates.
positive_templates = [
    "I love this product", "This is amazing", "Absolutely fantastic experience",
    "Highly recommend this", "I really enjoy using this", "This is outstanding",
    "Wonderful purchase", "The best I've ever used", "This exceeded my expectations",
    "I am very satisfied with this", "A truly great experience", "Totally worth it",
    "Fantastic design and quality", "One of the best purchases I've made",
    "This is a game changer", "Amazing value for the price", "Couldn't be happier",
    "I would buy this again", "This made my life easier", "Everything about this is perfect",
    "Beyond my expectations", "So happy with this", "Truly a masterpiece",
    "Exceptional quality and performance", "Super smooth and reliable",
    "It works flawlessly", "Love it more every day", "My favorite product ever",
    "Can't imagine life without it", "Genuinely impressed"
]

negative_templates = [
    "I hate this product", "This is terrible", "Absolutely awful experience",
    "Do not recommend this at all", "I really dislike using this", "This is the worst thing ever",
    "What a waste of money", "Completely disappointed", "This did not meet my expectations",
    "I am very dissatisfied with this", "A truly frustrating experience", "Totally useless",
    "Terrible design and quality", "One of the worst purchases I've made",
    "This is a disaster", "Horrible value for the price", "I regret buying this",
    "Would never buy this again", "This made my life harder", "Everything about this is bad",
    "Far below expectations", "So upset with this", "Truly a nightmare",
    "Pathetic quality and performance", "Super buggy and unreliable",
    "It constantly fails", "Hate it more every day", "My least favorite product ever",
    "Can't believe how bad this is", "Genuinely the worst"
]

adjectives = [
    "incredible", "mediocre", "outstanding", "dull", "remarkable", "lousy", "great", "horrible", 
    "disappointing", "satisfying", "terrific", "useless", "brilliant", "frustrating", "exciting", 
    "annoying", "perfect", "awful", "delightful", "poor", "astonishing", "dreadful", "phenomenal", 
    "atrocious", "mind-blowing", "unbearable", "spectacular", "horrid", "breathtaking", "appalling"
]

num_samples_per_class = 5000

# Create datasets.
positive_data = positive_templates.copy()
negative_data = negative_templates.copy()

for _ in range(num_samples_per_class):
    pos_sentence = random.choice(positive_templates) + " " + random.choice(adjectives)
    positive_data.append(pos_sentence)
    neg_sentence = random.choice(negative_templates) + " " + random.choice(adjectives)
    negative_data.append(neg_sentence)

data = positive_data + negative_data
labels = [1] * len(positive_data) + [0] * len(negative_data)

df = pd.DataFrame({'text': data, 'sentiment': labels})
print(f"Generated dataset with {len(df)} samples.")

# Create TF-IDF features.
vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
X = vectorizer.fit_transform(df['text'])

# Shuffle and split the data.
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
X_train, X_test, y_train, y_test = train_test_split(X, df['sentiment'], test_size=0.2, random_state=42)

# Train logistic regression model.
model = LogisticRegression(max_iter=2000)
model.fit(X_train, y_train)

# Sanity check: Ensure a positive review is predicted as positive.
sample_input = "I love this product"
predicted = model.predict(vectorizer.transform([sample_input]))[0]
print(f"Sanity check for '{sample_input}':", "positive" if predicted == 1 else "negative"
