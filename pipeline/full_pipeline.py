import os
import re
import torch
import pytesseract
import soundfile as sf
import numpy as np
from PIL import Image
from pdf2image import convert_from_path
from transformers import pipeline
from deep_translator import GoogleTranslator
from fastapi import FastAPI, UploadFile, File
import shutil
import tempfile

# Path to Tesseract (Windows only, skip if on Linux with PATH set)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI(title="Translation Pipeline API")



# Utility Functions

def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_malayalam(text: str) -> bool:
    mal_count = sum(0x0D00 <= ord(ch) <= 0x0D7F for ch in text)
    eng_count = sum(0x0000 <= ord(ch) <= 0x007F for ch in text if ch.isalpha())
    return mal_count > eng_count


def translate_text(text: str, source="ml", target="en") -> str:
    sentences = re.split(r'[.?!\n]', text)
    result = []
    for sent in sentences:
        sent = sent.strip()
        if sent:
            try:
                tr = GoogleTranslator(source=source, target=target).translate(sent)
                result.append(tr)
            except Exception:
                result.append(f"[Translation failed: {sent}]")
    return " ".join(result)


def split_audio(audio_path, chunk_length=30, output_folder="chunks"):
    os.makedirs(output_folder, exist_ok=True)
    audio, sr = sf.read(audio_path)
    if len(audio.shape) > 1:
        audio = np.mean(audio, axis=1)
    samples_per_chunk = int(chunk_length * sr)
    chunks = []
    for i in range(0, len(audio), samples_per_chunk):
        chunk = audio[i:i + samples_per_chunk]
        chunk_file = os.path.join(output_folder, f"chunk_{i//samples_per_chunk}.wav")
        sf.write(chunk_file, chunk, sr)
        chunks.append(chunk_file)
    return chunks



# Handlers

def process_text_file(filepath: str):
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()
    text = clean_text(text)
    return translate_text(text) if is_malayalam(text) else text


def process_pdf_file(filepath: str, poppler_path=None):
    pages = convert_from_path(filepath, poppler_path=poppler_path)
    translated_pages = []
    for page in pages:
        text = pytesseract.image_to_string(page, lang="mal+eng")
        text = clean_text(text)
        if text:
            translated_pages.append(translate_text(text) if is_malayalam(text) else text)
    return "\n".join(translated_pages)


def process_image_file(filepath: str):
    image = Image.open(filepath)
    text = pytesseract.image_to_string(image, lang="mal+eng")
    text = clean_text(text)
    return translate_text(text) if is_malayalam(text) else text


def process_audio_file(filepath: str, model_name="vrclc/Whisper-small-Malayalam"):
    device = 0 if torch.cuda.is_available() else -1
    asr = pipeline("automatic-speech-recognition", model=model_name, device=device)

    info = sf.info(filepath)
    duration = info.frames / info.samplerate
    all_transcriptions = []

    if duration <= 30:
        result = asr(filepath)
        text = clean_text(result["text"])
        all_transcriptions.append(text)
    else:
        chunks = split_audio(filepath, chunk_length=30, output_folder="chunks")
        for chunk in chunks:
            result = asr(chunk)
            text = clean_text(result["text"])
            all_transcriptions.append(text)

    full_text = " ".join(all_transcriptions)
    return translate_text(full_text, source="ml", target="en")



# API Endpoints

@app.post("/translate/")
async def translate_file(file: UploadFile = File(...)):
    ext = file.filename.lower().split(".")[-1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        if ext == "txt":
            result = process_text_file(tmp_path)
        elif ext == "pdf":
            result = process_pdf_file(tmp_path, poppler_path=r"C:\Users\Akhil\Downloads\Release-23.11.0-0\poppler-23.11.0\Library\bin")
        elif ext in ["png", "jpg", "jpeg"]:
            result = process_image_file(tmp_path)
        elif ext in ["mp3", "wav"]:
            result = process_audio_file(tmp_path)
        else:
            return {"error": f"Unsupported file type: {ext}"}
    finally:
        os.remove(tmp_path)

    return {"filename": file.filename, "translation": result}
