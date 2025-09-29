import os
import requests

FOLDER = "test_files"
URL = "http://127.0.0.1:8000/translate/"

def send_file(filepath):
    with open(filepath, "rb") as f:
        files = {"file": (os.path.basename(filepath), f)}
        response = requests.post(URL, files=files)
    return response.json()

if __name__ == "__main__":
    for file in os.listdir(FOLDER):
        filepath = os.path.join(FOLDER, file)
        if os.path.isfile(filepath):
            print(f"\n>>> Sending {file} ...")
            result = send_file(filepath)
            print("Response:", result)
