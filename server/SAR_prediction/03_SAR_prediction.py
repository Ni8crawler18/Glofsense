import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import joblib
from datetime import datetime, timedelta
import seaborn as sns

def load_features():
    """Load features from the CSV file."""
    features_path = 'features/lake_features.csv'
    if not os.path.exists(features_path):
        raise FileNotFoundError(f"Features file not found at {features_path}. Run preprocessing first.")
    
    return pd.read_csv(features_path)

def prepare_time_series(df):
    """
    Prepare the time series data for LSTM model.
    
    Args:
        df: DataFrame containing lake features
        
    Returns:
        X: Input sequences
        y: Target values
        scaler: Fitted scaler for inverse transformation
    """
    # Sort by filename (assuming filenames contain date information)
    df = df.sort_values('filename')
    
    # Extract features
    data = df[['area', 'perimeter', 'area_perimeter_ratio']].values
    
    # Normalize the data
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    # Create sequences for LSTM
    X, y = [], []
    sequence_length = 3  # Use 3 time steps to predict the next
    
    for i in range(len(scaled_data) - sequence_length):
        X.append(scaled_data[i:i + sequence_length])
        y.append(scaled_data[i + sequence_length])
    
    return np.array(X), np.array(y), scaler

def build_lstm_model(input_shape):
    """Build and compile the LSTM model."""
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(3)  # Predict area, perimeter, and area/perimeter ratio
    ])
    
    model.compile(optimizer='adam', loss='mse')
    return model

def calculate_classification_metrics(y_true, y_pred, threshold=0.05):
    """
    Calculate classification metrics by converting regression to binary classification.
    
    Args:
        y_true: Ground truth values
        y_pred: Predicted values
        threshold: Threshold for considering a prediction correct (relative error)
        
    Returns:
        Dictionary of classification metrics
    """
    # Focus on area prediction (first column)
    y_true_area = y_true[:, 0]
    y_pred_area = y_pred[:, 0]
    
    # Create binary classification based on significant area change (if applicable)
    if len(y_true_area) > 1:
        # Calculate change rates for true values
        true_changes = np.abs(np.diff(y_true_area)) / y_true_area[:-1]
        
        # Calculate change rates for predicted values
        pred_changes = np.abs(np.diff(y_pred_area)) / y_pred_area[:-1]
        
        # Define significant changes (binary classification)
        significant_threshold = 0.1  # 10% change
        true_significant = (true_changes > significant_threshold).astype(int)
        pred_significant = (pred_changes > significant_threshold).astype(int)
        
        if len(true_significant) > 0:
            # Calculate classification metrics
            acc = accuracy_score(true_significant, pred_significant)
            prec = precision_score(true_significant, pred_significant, zero_division=0)
            rec = recall_score(true_significant, pred_significant, zero_division=0)
            f1 = f1_score(true_significant, pred_significant, zero_division=0)
            
            # Generate confusion matrix
            cm = confusion_matrix(true_significant, pred_significant)
            
            return {
                'accuracy': acc,
                'precision': prec,
                'recall': rec,
                'f1_score': f1,
                'confusion_matrix': cm
            }
    
    # Alternative approach for direct predictions (is prediction within threshold of true value)
    relative_errors = np.abs(y_true_area - y_pred_area) / y_true_area
    correct_predictions = (relative_errors <= threshold).astype(int)
    accuracy = np.mean(correct_predictions)
    
    return {
        'accuracy': accuracy,
        'precision': None,  # Not applicable for this approach
        'recall': None,     # Not applicable for this approach
        'f1_score': None    # Not applicable for this approach
    }

def train_model(X, y):
    """Train the LSTM model."""
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Build the model
    model = build_lstm_model((X.shape[1], X.shape[2]))
    
    # Early stopping to prevent overfitting
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )
    
    # Train the model
    history = model.fit(
        X_train, y_train,
        epochs=100,
        batch_size=4,
        validation_data=(X_test, y_test),
        callbacks=[early_stopping],
        verbose=1
    )
    
    # Evaluate the model
    y_pred = model.predict(X_test)
    
    # Calculate regression metrics
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test.reshape(-1), y_pred.reshape(-1))
    
    # Calculate mean absolute percentage error for area prediction
    y_test_area = y_test[:, 0]
    y_pred_area = y_pred[:, 0]
    mape = np.mean(np.abs((y_test_area - y_pred_area) / y_test_area)) * 100
    
    # Calculate classification metrics
    classification_metrics = calculate_classification_metrics(y_test, y_pred)
    
    # Print evaluation metrics
    print(f"Regression Metrics:")
    print(f"  Mean Squared Error: {mse:.6f}")
    print(f"  Root Mean Squared Error: {rmse:.6f}")
    print(f"  R² Score: {r2:.6f}")
    print(f"  Mean Absolute Percentage Error: {mape:.2f}%")
    
    print(f"\nClassification Metrics:")
    print(f"  Accuracy: {classification_metrics.get('accuracy', 'N/A'):.4f}")
    
    if classification_metrics.get('precision') is not None:
        print(f"  Precision: {classification_metrics.get('precision', 'N/A'):.4f}")
        print(f"  Recall: {classification_metrics.get('recall', 'N/A'):.4f}")
        print(f"  F1 Score: {classification_metrics.get('f1_score', 'N/A'):.4f}")
    
    # Plot training history
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.ylabel('Loss')
    plt.xlabel('Epoch')
    plt.legend()
    
    # Plot predictions vs actual
    plt.subplot(1, 2, 2)
    plt.scatter(y_test[:, 0], y_pred[:, 0])
    plt.plot([min(y_test[:, 0]), max(y_test[:, 0])], [min(y_test[:, 0]), max(y_test[:, 0])], 'r--')
    plt.xlabel('Actual')
    plt.ylabel('Predicted')
    plt.title('Actual vs Predicted Values (Area)')
    plt.savefig('model_evaluation.png')
    
    # Plot confusion matrix if available
    if 'confusion_matrix' in classification_metrics and classification_metrics['confusion_matrix'] is not None:
        plt.figure(figsize=(8, 6))
        sns.heatmap(
            classification_metrics['confusion_matrix'], 
            annot=True, 
            fmt='d',
            cmap='Blues',
            xticklabels=['No Change', 'Significant Change'],
            yticklabels=['No Change', 'Significant Change']
        )
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.title('Confusion Matrix - Significant Area Changes')
        plt.savefig('confusion_matrix.png')
    
    # Combine all metrics
    all_metrics = {
        'mse': mse,
        'rmse': rmse,
        'r2': r2,
        'mape': mape,
        **classification_metrics
    }
    
    return model, all_metrics, y_test, y_pred, history

def predict_future(model, X, scaler, steps=5):
    """
    Predict future lake characteristics.
    
    Args:
        model: Trained LSTM model
        X: Input sequences used for training
        scaler: Fitted scaler for inverse transformation
        steps: Number of future steps to predict
        
    Returns:
        future_predictions: Array of predicted future values
    """
    # Get the last sequence from the input data
    last_sequence = X[-1:].copy()  # Shape: (1, sequence_length, features)
    
    future_predictions = []
    
    for _ in range(steps):
        # Predict the next time step
        next_pred = model.predict(last_sequence)  # Shape: (1, features)
        
        # Store the prediction
        future_predictions.append(next_pred[0])
        
        # Update the sequence by removing the first element and adding the prediction
        # First, reshape the prediction to match the expected format
        pred_reshaped = next_pred.reshape(1, 1, X.shape[2])
        
        # Then, update the sequence by dropping the first timestep and adding the new prediction
        last_sequence = np.concatenate([last_sequence[:, 1:, :], pred_reshaped], axis=1)
    
    # Convert predictions to numpy array and inverse transform
    future_predictions = np.array(future_predictions)
    future_predictions = scaler.inverse_transform(future_predictions)
    
    return future_predictions

def assess_glof_risk(predictions, threshold=0.1):
    """
    Assess GLOF risk based on predicted area changes.
    
    Args:
        predictions: Array of predicted future values
        threshold: Threshold for significant area change
        
    Returns:
        risk_dates: List of dates with high risk
        risk_levels: List of risk levels (0-1 scale)
    """
    # Calculate area change rates
    area_changes = np.diff(predictions[:, 0]) / predictions[:-1, 0]
    
    # Assign risk levels based on area change rate
    risk_levels = []
    for change in area_changes:
        if change > threshold:
            # Expansion indicates increased risk
            risk = min(change / (threshold * 10), 1)  # Normalize to 0-1
            risk_levels.append(risk)
        elif change < -threshold:
            # Rapid decrease might also indicate outburst
            risk = min(abs(change) / (threshold * 10), 1)  # Normalize to 0-1
            risk_levels.append(risk)
        else:
            risk_levels.append(0)
    
    # Generate future dates (assuming 10-day intervals for Sentinel-1)
    today = datetime.now()
    future_dates = [(today + timedelta(days=10*(i+1))).strftime('%Y-%m-%d') 
                   for i in range(len(risk_levels))]
    
    return future_dates, risk_levels

def save_model(model, scaler, metrics):
    """Save the model and related components."""
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    # Save the keras model
    model.save('models/glof_lstm_model.h5')
    
    # Save the scaler
    joblib.dump(scaler, 'models/glof_scaler.joblib')
    
    # Save the model using joblib as well
    model_wrapper = {
        'keras_model': model,
        'scaler': scaler,
        'metrics': metrics
    }
    joblib.dump(model_wrapper, 'models/glof_model.joblib')
    
    # Save evaluation metrics
    with open('models/evaluation_metrics.txt', 'w') as f:
        f.write("=== Regression Metrics ===\n")
        f.write(f"Mean Squared Error: {metrics['mse']:.6f}\n")
        f.write(f"Root Mean Squared Error: {metrics['rmse']:.6f}\n")
        f.write(f"R² Score: {metrics['r2']:.6f}\n")
        f.write(f"Mean Absolute Percentage Error: {metrics['mape']:.2f}%\n\n")
        
        f.write("=== Classification Metrics ===\n")
        f.write(f"Accuracy: {metrics.get('accuracy', 'N/A')}\n")
        
        if metrics.get('precision') is not None:
            f.write(f"Precision: {metrics.get('precision', 'N/A'):.4f}\n")
            f.write(f"Recall: {metrics.get('recall', 'N/A'):.4f}\n")
            f.write(f"F1 Score: {metrics.get('f1_score', 'N/A'):.4f}\n")
    
    print("Model saved successfully in 'models' directory")

def generate_classification_report(y_test, y_pred, threshold=0.1):
    """
    Generate a classification report based on significant area changes.
    
    Args:
        y_test: Ground truth values
        y_pred: Predicted values
        threshold: Threshold for significant change
        
    Returns:
        Classification report as a formatted string
    """
    # Extract area values
    y_test_area = y_test[:, 0]
    y_pred_area = y_pred[:, 0]
    
    if len(y_test_area) <= 1:
        return "Not enough data points for classification report"
    
    # Calculate change rates
    true_changes = np.abs(np.diff(y_test_area)) / y_test_area[:-1]
    pred_changes = np.abs(np.diff(y_pred_area)) / y_pred_area[:-1]
    
    # Create binary classification
    true_significant = (true_changes > threshold).astype(int)
    pred_significant = (pred_changes > threshold).astype(int)
    
    # Calculate metrics
    acc = accuracy_score(true_significant, pred_significant)
    prec = precision_score(true_significant, pred_significant, zero_division=0)
    rec = recall_score(true_significant, pred_significant, zero_division=0)
    f1 = f1_score(true_significant, pred_significant, zero_division=0)
    
    # Create report
    report = (
        "Classification Report (Significant Area Changes)\n"
        "================================================\n"
        f"Accuracy:  {acc:.4f}\n"
        f"Precision: {prec:.4f}\n"
        f"Recall:    {rec:.4f}\n"
        f"F1 Score:  {f1:.4f}\n\n"
        "Confusion Matrix:\n"
    )
    
    # Add confusion matrix
    cm = confusion_matrix(true_significant, pred_significant)
    report += f"               Predicted\n"
    report += f"              No    Yes\n"
    report += f"Actual No    {cm[0][0]:<6} {cm[0][1]:<6}\n"
    report += f"      Yes    {cm[1][0]:<6} {cm[1][1]:<6}\n"
    
    return report

def main():
    # Load features extracted from images
    df = load_features()
    
    if len(df) < 4:
        print("Warning: Not enough data points for LSTM modeling. Need at least 4 images.")
        return
    
    # Prepare data for LSTM
    X, y, scaler = prepare_time_series(df)
    
    # Train the model
    model, metrics, y_test, y_pred, history = train_model(X, y)
    
    # Generate classification report
    class_report = generate_classification_report(y_test, y_pred)
    print("\nClassification Report:")
    print(class_report)
    
    # Save classification report
    with open('models/classification_report.txt', 'w') as f:
        f.write(class_report)
    
    # Predict future lake characteristics
    future_predictions = predict_future(model, X, scaler, steps=5)
    
    # Assess GLOF risk
    future_dates, risk_levels = assess_glof_risk(future_predictions)
    
    # Display results
    print("\nPredicted Future Lake Characteristics:")
    for i, (date, pred, risk) in enumerate(zip(future_dates, future_predictions[1:], risk_levels)):
        print(f"Date: {date}")
        print(f"  - Area: {pred[0]:.2f} pixels")
        print(f"  - Perimeter: {pred[1]:.2f} pixels")
        print(f"  - Area/Perimeter Ratio: {pred[2]:.4f}")
        print(f"  - GLOF Risk Level: {risk:.4f}")
    
    # Plot predictions and metrics
    plt.figure(figsize=(15, 10))
    
    # Test set predictions
    plt.subplot(2, 2, 1)
    plt.scatter(range(len(y_test)), y_test[:, 0], label='Actual')
    plt.scatter(range(len(y_pred)), y_pred[:, 0], label='Predicted')
    plt.title('Test Set Predictions (Area)')
    plt.legend()
    
    # Future predictions
    plt.subplot(2, 2, 2)
    plt.plot(range(len(future_predictions)), future_predictions[:, 0], marker='o', label='Area')
    plt.plot(range(len(risk_levels)), [r * np.max(future_predictions[:, 0]) for r in risk_levels], 
             'r--', label='Risk Level')
    plt.title('Future Predictions and Risk Levels')
    plt.legend()
    
    # Add residual plot
    plt.subplot(2, 2, 3)
    residuals = y_test[:, 0] - y_pred[:, 0]
    plt.scatter(y_pred[:, 0], residuals)
    plt.axhline(y=0, color='r', linestyle='-')
    plt.title('Residual Plot')
    plt.xlabel('Predicted Values')
    plt.ylabel('Residuals')
    
    # Add histogram of errors
    plt.subplot(2, 2, 4)
    plt.hist(residuals, bins=10)
    plt.title('Distribution of Errors')
    plt.xlabel('Error')
    plt.ylabel('Frequency')
    
    plt.tight_layout()
    plt.savefig('enhanced_prediction_results.png')
    
    # Save model and metrics
    save_model(model, scaler, metrics)
    
    # Create a summary report of all analysis
    with open('analysis_summary.txt', 'w') as f:
        f.write("GLOF Risk Assessment - Analysis Summary\n")
        f.write("======================================\n\n")
        
        f.write("1. Model Performance Metrics\n")
        f.write("---------------------------\n")
        f.write(f"Mean Squared Error: {metrics['mse']:.6f}\n")
        f.write(f"Root Mean Squared Error: {metrics['rmse']:.6f}\n")
        f.write(f"R² Score: {metrics['r2']:.6f}\n")
        f.write(f"Mean Absolute Percentage Error: {metrics['mape']:.2f}%\n\n")
        
        f.write("2. Classification Performance\n")
        f.write("----------------------------\n")
        f.write(f"Accuracy: {metrics.get('accuracy', 'N/A')}\n")
        if metrics.get('precision') is not None:
            f.write(f"Precision: {metrics.get('precision', 'N/A'):.4f}\n")
            f.write(f"Recall: {metrics.get('recall', 'N/A'):.4f}\n")
            f.write(f"F1 Score: {metrics.get('f1_score', 'N/A'):.4f}\n\n")
        
        f.write("3. Future Predictions\n")
        f.write("-------------------\n")
        for i, (date, pred, risk) in enumerate(zip(future_dates, future_predictions[1:], risk_levels)):
            f.write(f"Date: {date}\n")
            f.write(f"  - Area: {pred[0]:.2f} pixels\n")
            f.write(f"  - Perimeter: {pred[1]:.2f} pixels\n")
            f.write(f"  - Area/Perimeter Ratio: {pred[2]:.4f}\n")
            f.write(f"  - GLOF Risk Level: {risk:.4f}\n\n")
        
        f.write("4. Risk Assessment Summary\n")
        f.write("-------------------------\n")
        max_risk = max(risk_levels) if risk_levels else 0
        max_risk_date = future_dates[risk_levels.index(max_risk)] if max_risk > 0 else "None"
        
        f.write(f"Maximum Risk Level: {max_risk:.4f}\n")
        f.write(f"Date of Maximum Risk: {max_risk_date}\n")
        f.write(f"Risk Threshold Used: {0.1}\n\n")
        
        f.write("5. Model Architecture\n")
        f.write("-------------------\n")
        model.summary(print_fn=lambda x: f.write(x + '\n'))

if __name__ == "__main__":
    main()