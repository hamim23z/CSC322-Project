'''
Created on Apr 13, 2025

@author: FemiA
'''
import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    #  Specific prompt to only fix grammar/spelling
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"""You are a grammar correction assistant. Do not rephrase or rewrite the structure unless absolutely necessary. 
Only fix spelling and grammatical errors in the following text. If there are no errors, respond with: "No changes needed."

Text:
\"\"\"{prompt}\"\"\""""
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(
            GEMINI_API_URL,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        result = response.json()

        generated = result["candidates"][0]["content"]["parts"][0]["text"]

        return jsonify({
            "original": prompt,
            "corrected": generated,
        })

    except Exception as e:
        print("Gemini error:", e)
        return jsonify({"error": "Gemini API call failed", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001)

