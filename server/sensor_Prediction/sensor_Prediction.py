import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import pickle

# Load dataset
df = pd.read_csv("data/south_lhonak_glof_samples.csv")

# Preprocess dataset (encode categorical labels)
df['glof_risk'] = df['glof_risk'].map({'Low': 0, 'Medium': 1, 'High': 2})

# Features and target
X = df.drop(columns=['glof_risk'])
y = df['glof_risk']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Convert to DMatrix format
dtrain = xgb.DMatrix(X_train, label=y_train)
dtest = xgb.DMatrix(X_test, label=y_test)

# Define model parameters
params = {
    'objective': 'multi:softprob',  # Change from softmax to softprob to get probabilities
    'num_class': 3,                 
    'max_depth': 6,
    'eta': 0.1,
    'eval_metric': 'merror'
}

# Train the XGBoost model
num_round = 100
model = xgb.train(params, dtrain, num_round)

# Predict on test data
y_pred_prob = model.predict(dtest)  # Now gets probabilities
y_pred = np.argmax(y_pred_prob, axis=1)  # Convert probabilities to class labels

# Calculate Accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f'Accuracy: {accuracy * 100:.2f}%')

# Confusion Matrix
conf_matrix = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:\n", conf_matrix)

# Classification Report (Precision, Recall, F1 Score)
class_report = classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High'])
print("Classification Report:\n", class_report)

# F1 Score
f1 = f1_score(y_test, y_pred, average='weighted')
print(f'F1 Score: {f1:.2f}')

# Precision
precision = precision_score(y_test, y_pred, average='weighted')
print(f'Precision: {precision:.2f}')

# Recall
recall = recall_score(y_test, y_pred, average='weighted')
print(f'Recall: {recall:.2f}')

# AUC (Area Under Curve) - multi-class probabilities
auc = roc_auc_score(y_test, y_pred_prob, multi_class='ovr', average='macro')
print(f'AUC (Area Under Curve): {auc:.2f}')

# Save model to a pickle file
with open("glof_risk_model.pkl", "wb") as model_file:
    pickle.dump(model, model_file)

print("Model saved as 'glof_risk_model.pkl'.")