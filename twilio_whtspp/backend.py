from fastapi import FastAPI, Body
import requests

app = FastAPI()

@app.post("/upload")
async def upload_file(payload: dict = Body(...)):
    media_url = payload["media_url"]
    media_type = payload["media_type"]

    # Download file from Twilio
    file_data = requests.get(media_url).content

    # Save to local storage
    filename = "received_file." + media_type.split("/")[-1]
    with open(filename, "wb") as f:
        f.write(file_data)

    return {"status": "success", "filename": filename}
