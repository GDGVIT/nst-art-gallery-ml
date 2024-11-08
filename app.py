from flask import Flask, request, send_file, jsonify
import io
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
from PIL import Image
import threading
import os
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS

# Update the model path to the Kaggle model path
model_path = "https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2"

# Load the pre-trained model once at startup
print("Loading pre-trained model...")
hub_module = hub.load(model_path)
print("Model loaded.")

# Lock for thread-safe operations
model_lock = threading.Lock()


def tensor_to_image(tensor):
    """
    Converts a tensor into a PIL Image.
    """
    tensor = tensor * 255  # Scale pixel values back to [0,255]
    tensor = tf.cast(tensor, tf.uint8)
    tensor = tensor.numpy()
    if np.ndim(tensor) > 3:
        tensor = tensor[0]  # Remove batch dimension
    return Image.fromarray(tensor)


def transfer_style(content_image, style_image):
    """
    Perform style transfer on the input images.

    :param content_image: PIL Image object of the content image.
    :param style_image: PIL Image object of the style image.
    :return: Stylized image as a PIL Image object.
    """

    # Preprocess images
    content_image = content_image.convert("RGB")
    style_image = style_image.convert("RGB")

    # Resize style image to (256,256) as required, content image remains the same size
    style_image = style_image.resize((256, 256))

    # Convert images to tensors
    content_image = np.array(content_image).astype(np.float32)[np.newaxis, ...] / 255.0
    style_image = np.array(style_image).astype(np.float32)[np.newaxis, ...] / 255.0

    # Perform style transfer within a thread-safe context
    with model_lock:
        stylized_image = hub_module(
            tf.constant(content_image), tf.constant(style_image)
        )[0]

    # Convert tensor to PIL Image
    stylized_image = tensor_to_image(stylized_image)

    return stylized_image


@app.route("/", methods=["GET"])
def index():
    return "Welcome to the Style Transfer API!"


@app.route("/stylize", methods=["POST"])
def stylize():
    """
    API endpoint to perform style transfer.
    Expects 'content_image' and 'style_image' files in the POST request.
    """

    if "content_image" not in request.files or "style_image" not in request.files:
        return (
            jsonify(
                {"error": "Please provide both content_image and style_image files."}
            ),
            400,
        )

    content_file = request.files["content_image"]
    style_file = request.files["style_image"]

    try:
        content_image = Image.open(content_file.stream).convert("RGB")
        style_image = Image.open(style_file.stream).convert("RGB")

        print("Processing images...")
        stylized_image = transfer_style(content_image, style_image)
        print("Style transfer completed.")

        # Save stylized image to a BytesIO object
        img_io = io.BytesIO()
        stylized_image.save(img_io, "JPEG", quality=95)
        img_io.seek(0)

        return send_file(img_io, mimetype="image/jpeg")

    except Exception as e:
        print(f"Error during style transfer: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, threaded=True)