
from fastapi import FastAPI, Body
import requests
from requests.auth import HTTPBasicAuth
import os

app = FastAPI()

UPLOAD_DIR = "received_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Put your Twilio credentials here
ACCOUNT_SID = ""
AUTH_TOKEN = ""

@app.post("/upload")
async def upload_file(payload: dict = Body(...)):
    media_url = payload["media_url"]
    media_type = payload["media_type"]

    # Use Twilio auth to download the real file
    resp = requests.get(media_url, auth=HTTPBasicAuth(ACCOUNT_SID, AUTH_TOKEN))

    if resp.status_code != 200:
        return {"error": f"Failed to download file from Twilio. Status {resp.status_code}"}

    # Save with correct extension
    ext = media_type.split("/")[-1]  # e.g. application/pdf -> pdf
    filename = f"received_file.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(resp.content)

    return {"status": "success", "filename": filename, "saved_to": file_path}

