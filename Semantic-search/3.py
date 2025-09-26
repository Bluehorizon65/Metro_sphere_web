# semantic_search_app.py (CLI version, no Streamlit)
import os
import tempfile
import numpy as np
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import torch

# ------------------ SYSTEM INFO ------------------
def check_system_info():
    """Check if system is using CPU or GPU"""
    print("\n" + "="*60)
    print("SYSTEM INFORMATION")
    print("="*60)
    
    try:
        if torch.cuda.is_available():
            print(f"✅ CUDA GPU Available: {torch.cuda.get_device_name(0)}")
            print(f"   GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
            print(f"   CUDA Version: {torch.version.cuda}")
            print(f"   PyTorch Version: {torch.__version__}")
            gpu_available = True
        else:
            print("❌ CUDA GPU Not Available")
            print(f"   PyTorch Version: {torch.__version__}")
            gpu_available = False
    except Exception as e:
        print(f"❌ PyTorch/CUDA check failed: {str(e)}")
        gpu_available = False
    
    print(f"🖥️  CPU Cores: {os.cpu_count()}")
    print(f"🤖 SentenceTransformers will use: {'GPU' if gpu_available else 'CPU'}")
    print("👁️  OCR Processing: CPU (pytesseract)")
    print("="*60)
    
    return gpu_available

# ------------------ MODEL LOAD ------------------
def load_model():
    gpu_available = check_system_info()
    try:
        if gpu_available:
            model = SentenceTransformer("all-MiniLM-L6-v2", device='cuda')
            device = 'GPU'
        else:
            model = SentenceTransformer("all-MiniLM-L6-v2", device='cpu')
            device = 'CPU'
    except:
        model = SentenceTransformer("all-MiniLM-L6-v2")
        device = 'CPU'
    
    print(f"📦 Model loaded on: {device}")
    return model

model = load_model()

# ------------------ GLOBAL STORAGE ------------------
pdf_embeddings = {}   # {filename: embedding}
file_names = []

# ------------------ PDF TEXT EXTRACTION ------------------
def extract_text_from_pdf(path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            text += txt + "\n"
    return text.strip()

# ------------------ OCR TEXT EXTRACTION ------------------
def extract_text_from_image(path):
    try:
        image = Image.open(path)
        text = pytesseract.image_to_string(image)
        print(f"🖼️ OCR extracted {len(text.strip())} characters from {os.path.basename(path)}")
        return text.strip()
    except Exception as e:
        print(f"❌ Error extracting text from image {path}: {str(e)}")
        return ""

def extract_text_from_pdf_with_ocr(path):
    # First, PyPDF2
    reader = PdfReader(path)
    pypdf_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            pypdf_text += txt + "\n"
    print(f"📄 PyPDF2 extracted {len(pypdf_text.strip())} characters from {os.path.basename(path)}")

    # Then OCR
    ocr_text = ""
    try:
        images = convert_from_path(path, first_page=1, last_page=min(3, len(reader.pages)))
        for i, image in enumerate(images):
            page_text = pytesseract.image_to_string(image)
            if page_text.strip():
                ocr_text += f"\n--- OCR Page {i+1} ---\n" + page_text
        print(f"🔍 OCR extracted {len(ocr_text.strip())} characters from {os.path.basename(path)}")
    except Exception as e:
        print(f"⚠️ OCR failed for {os.path.basename(path)}: {str(e)}")

    combined_text = pypdf_text
    if ocr_text.strip():
        combined_text += "\n\n--- OCR EXTRACTED TEXT ---\n" + ocr_text
    print(f"📊 Combined total characters: {len(combined_text.strip())}")
    return combined_text.strip()

# ------------------ INGESTION ------------------
def ingest_files(paths):
    global pdf_embeddings, file_names
    print(f"🔄 Processing {len(paths)} file(s)...")
    
    for path in paths:
        ext = path.lower().split('.')[-1]
        if ext == 'pdf':
            text = extract_text_from_pdf_with_ocr(path)
        elif ext in ['png', 'jpg', 'jpeg', 'tiff', 'bmp']:
            text = extract_text_from_image(path)
        else:
            print(f"❌ Unsupported file type: {path}")
            continue
        
        if not text:
            print(f"❌ No text extracted from {path}")
            continue

        print("🧠 Creating semantic embeddings...")
        emb = model.encode([text], convert_to_numpy=True).astype("float32")
        fname = os.path.basename(path)
        pdf_embeddings[fname] = emb
        if fname not in file_names:
            file_names.append(fname)
        
        print(f"✅ Successfully processed {fname}")
    
    print(f"🎉 All files processed! Ready to search across {len(file_names)} documents.")

# ------------------ SEARCH ------------------
def search(query):
    if not pdf_embeddings:
        print("❌ No documents uploaded.")
        return []
    
    q_emb = model.encode([query], convert_to_numpy=True).astype("float32")

    results = []
    for fname, emb in pdf_embeddings.items():
        sim = np.dot(q_emb, emb.T) / (np.linalg.norm(q_emb) * np.linalg.norm(emb))
        sim_score = sim[0][0]
        match_percent = round(((sim_score + 1) / 2) * 100, 2)
        results.append({"file": fname, "match": match_percent, "raw_similarity": round(sim_score, 4)})

    results = sorted(results, key=lambda x: x["match"], reverse=True)
    return results

# ------------------ MAIN (CLI) ------------------
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Semantic Search over PDFs and Images with OCR")
    parser.add_argument("--files", nargs="+", help="Paths to PDF or image files", required=True)
    parser.add_argument("--query", type=str, help="Search query", required=True)
    args = parser.parse_args()

    ingest_files(args.files)
    results = search(args.query)

    print("\n📊 Search Results")
    if results:
        for r in results:
            status = "🟢" if r["match"] > 60 else "🟡" if r["match"] > 50 else "🔴"
            print(f"- {r['file']}: {status} {r['match']}% (similarity {r['raw_similarity']})")
    else:
        print("❌ No results found.")
