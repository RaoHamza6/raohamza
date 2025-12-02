import requests
from flask import Flask, request, send_file, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
REMOVE_BG_API_KEY = "hN3k46e9t9gSvpTkY1siL6NH"  # Replace with your API key from https://www.remove.bg/api

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(".", path)

@app.route("/remove-bg", methods=["POST"])
def remove_background():
    # Check if API key is configured
    if REMOVE_BG_API_KEY == "YOUR_API_KEY_HERE":
        return jsonify({
            "error": "⚠️ API Key Not Configured!\n\n1. Sign up at https://www.remove.bg/api\n2. Get your free API key\n3. Replace 'YOUR_API_KEY_HERE' in app.py (line 9)\n4. Restart the Flask server"
        }), 400
    
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    
    # Read file data once
    file_data = file.read()

    try:
        response = requests.post(
            "https://api.remove.bg/v1.0/removebg",
            files={"image_file": (file.filename, io.BytesIO(file_data), file.mimetype)},
            data={"size": "auto"},
            headers={"X-Api-Key": REMOVE_BG_API_KEY},
            timeout=30
        )

        if response.status_code != 200:
            error_message = f"Remove.bg API error (Status {response.status_code}): {response.text}"
            return jsonify({"error": error_message}), 500

        output_image = io.BytesIO(response.content)
        return send_file(output_image, mimetype="image/png")
        
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timed out. Please try again with a smaller image."}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Network error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


if __name__ == "__main__":

    app.run(debug=True)



