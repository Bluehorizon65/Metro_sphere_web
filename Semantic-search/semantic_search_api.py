from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import torch
import tempfile

# ------------------ SYSTEM INFO ------------------
def check_system_info():
    gpu_available = torch.cuda.is_available()
    print("✅ GPU Available" if gpu_available else "❌ GPU Not Available")
    return gpu_available

# ------------------ MODEL LOAD ------------------
gpu_available = check_system_info()
if gpu_available:
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda")
else:
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

# ------------------ GLOBAL STORAGE ------------------
pdf_embeddings = {}   # {filename: embedding}
file_names = []

# ------------------ PDF & IMAGE TEXT EXTRACTION ------------------
def extract_text_from_pdf_with_ocr(path):
    reader = PdfReader(path)
    pypdf_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            pypdf_text += txt + "\n"

    ocr_text = ""
    try:
        images = convert_from_path(path, first_page=1, last_page=min(3, len(reader.pages)))
        for i, image in enumerate(images):
            page_text = pytesseract.image_to_string(image)
            if page_text.strip():
                ocr_text += f"\n--- OCR Page {i+1} ---\n" + page_text
    except Exception as e:
        print(f"OCR failed: {str(e)}")

    return (pypdf_text + "\n" + ocr_text).strip()

def extract_text_from_image(path):
    try:
        image = Image.open(path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"OCR image failed: {str(e)}")
        return ""

# ------------------ INGESTION ------------------
def ingest_file(file_path, filename):
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        text = extract_text_from_pdf_with_ocr(file_path)
    elif ext in ["png", "jpg", "jpeg", "tiff", "bmp"]:
        text = extract_text_from_image(file_path)
    else:
        return False, f"Unsupported file type: {filename}"

    if not text:
        return False, f"No text extracted from {filename}"

    emb = model.encode([text], convert_to_numpy=True).astype("float32")
    pdf_embeddings[filename] = emb
    if filename not in file_names:
        file_names.append(filename)
    return True, f"Successfully processed {filename}"

# ------------------ SEARCH ------------------
def search(query: str):
    if not pdf_embeddings:
        return []

    q_emb = model.encode([query], convert_to_numpy=True).astype("float32")

    results = []
    for fname, emb in pdf_embeddings.items():
        sim = np.dot(q_emb, emb.T) / (np.linalg.norm(q_emb) * np.linalg.norm(emb))
        sim_score = float(sim)  # ensure scalar
        match_percent = round(((sim_score + 1) / 2) * 100, 2)
        results.append({
            "file": fname,
            "match": match_percent,
            "raw_similarity": round(sim_score, 4)
        })

    results = sorted(results, key=lambda x: x["match"], reverse=True)
    return results


# ------------------ FASTAPI APP ------------------
app = FastAPI(title="Semantic Search API", description="Upload PDFs/Images and search them semantically")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save temporarily
        temp = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}")
        temp.write(await file.read())
        temp.close()

        success, msg = ingest_file(temp.name, file.filename)
        os.remove(temp.name)

        if success:
            return {"status": "success", "message": msg, "total_documents": len(file_names)}
        else:
            return JSONResponse(status_code=400, content={"status": "error", "message": msg})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/search")
async def search_docs(query: str):
    if not query.strip():
        return JSONResponse(status_code=400, content={"status": "error", "message": "Query cannot be empty"})
    
    results = search(query)
    return {"query": query, "results": results}

@app.get("/")
def root():
    return {"message": "Welcome to the Semantic Search API! Use /upload to add documents and /search to query."}

# ------------------ ENTRY POINT ------------------
if __name__ == "__main__":
    import uvicorn
    # You don’t need CLI, just run: python semantic_search_api.py
    uvicorn.run(app, host="127.0.0.1", port=8001)
