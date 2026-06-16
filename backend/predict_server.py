import os
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import uvicorn

# Initialize the FastAPI core engine
app = FastAPI(
    title="DermAI Core AI Engine",
    description="Production-grade FastAPI pipeline for real-time CNN lesion classification."
)

# 🧠 CRITICAL: Load your TensorFlow neural network layers into RAM ONCE during boot setup
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'skin_cancer_efficientnet.keras')
print("[STARTUP] Loading TensorFlow model layers into RAM... Please wait.")
model = tf.keras.models.load_model(MODEL_PATH)
print("[STARTUP] Model loaded successfully! Listening for instant predictions on port 5001.")

# Establish a strict validation schema layout for incoming Node.js payloads using Pydantic
class InferencePayload(BaseModel):
    image_path: str

@app.post("/predict")
async def predict(payload: InferencePayload):
    # 1. Validation check to ensure the target file exists on your hard drive
    if not os.path.exists(payload.image_path):
        raise HTTPException(status_code=400, detail="Target processing image path context does not exist on disk system memory.")

    try:
        # 2. Extract image and scale matrix layers down to fit CNN geometry
        img = Image.open(payload.image_path).resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # 3. Calculate probability scores using your deep learning graph matrix
        predictions = model.predict(img_array)
        score = float(predictions[0][0])

        # 4. Map statistical thresholds to clear clinical labeling classifications
        prediction_label = "Malignant" if score > 0.5 else "Benign"
        confidence_metric = score if prediction_label == "Malignant" else (1.0 - score)

        # 5. Hand back clean, raw JSON metrics matching exactly what Node.js expects
        return {
            "prediction": prediction_label,
            "confidence": confidence_metric
        }

    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Inference execution tensor grid failure: {str(err)}")

# Direct execution entry point hook. When Node runs this file, Uvicorn will boot up FastAPI.
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)