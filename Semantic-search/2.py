# semantic_search_app.py
import streamlit as st
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
    
    # Check PyTorch GPU availability
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
    
    # Check CPU info
    print(f"🖥️  CPU Cores: {os.cpu_count()}")
    
    # Check SentenceTransformers device
    print(f"🤖 SentenceTransformers will use: {'GPU' if gpu_available else 'CPU'}")
    
    # OCR info
    print("👁️  OCR Processing: CPU (pytesseract)")
    print("="*60)
    
    return gpu_available

# ------------------ MODEL LOAD ------------------
@st.cache_resource
def load_model():
    # Check system info when loading model
    gpu_available = check_system_info()
    
    # Load model and specify device
    try:
        if gpu_available:
            model = SentenceTransformer("all-MiniLM-L6-v2", device='cuda')
            device = 'GPU'
        else:
            model = SentenceTransformer("all-MiniLM-L6-v2", device='cpu')
            device = 'CPU'
    except:
        # Fallback to CPU if GPU fails
        model = SentenceTransformer("all-MiniLM-L6-v2")
        device = 'CPU'
    
    print(f"📦 Model loaded on: {device}")
    return model

model = load_model()

# ------------------ GLOBAL STORAGE ------------------
pdf_embeddings = {}   # {filename: embedding}
file_names = []

# ------------------ PDF TEXT EXTRACTION ------------------
def extract_text_from_pdf(file):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.write(file.read())
    temp_file.close()

    reader = PdfReader(temp_file.name)
    text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            text += txt + "\n"

    os.remove(temp_file.name)
    return text.strip()

# ------------------ OCR TEXT EXTRACTION ------------------
def extract_text_from_image(file):
    """Extract text from image file using OCR"""
    try:
        # Save uploaded file to temporary location
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        temp_file.write(file.read())
        temp_file.close()
        
        # Open image and extract text using OCR
        image = Image.open(temp_file.name)
        text = pytesseract.image_to_string(image)
        
        # Show detailed OCR results in UI
        st.write(f"🖼️ **OCR Results for {file.name}:**")
        st.write(f"- Extracted **{len(text.strip())} characters**")
        
        if text.strip():
            with st.expander(f"📖 View extracted text from {file.name}"):
                st.text_area("Extracted Text:", text, height=200, key=f"ocr_text_{file.name}")
        else:
            st.warning(f"⚠️ No text found in {file.name}")
        
        os.remove(temp_file.name)
        return text.strip()
    except Exception as e:
        st.error(f"❌ Error extracting text from image: {str(e)}")
        return ""

def extract_text_from_pdf_with_ocr(file):
    """Extract text from PDF using both PyPDF2 and OCR"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.write(file.read())
    temp_file.close()
    
    # First, extract text using PyPDF2
    reader = PdfReader(temp_file.name)
    pypdf_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            pypdf_text += txt + "\n"
    
    # Show PyPDF2 results in UI
    st.write(f"📄 **PyPDF2 Results for {file.name}:**")
    st.write(f"- Found **{len(reader.pages)} pages**")
    st.write(f"- Extracted **{len(pypdf_text.strip())} characters** using PyPDF2")
    
    if pypdf_text.strip():
        with st.expander(f"📖 View PyPDF2 extracted text from {file.name}"):
            st.text_area("PyPDF2 Text:", pypdf_text[:2000] + "..." if len(pypdf_text) > 2000 else pypdf_text, 
                        height=200, key=f"pypdf_text_{file.name}")
    
    # Then, extract text using OCR from PDF images
    ocr_text = ""
    try:
        st.write("🔄 **Converting PDF to images for OCR...**")
        # Limit to first 3 pages for performance in demo
        images = convert_from_path(temp_file.name, first_page=1, last_page=min(3, len(reader.pages)))
        
        progress_bar = st.progress(0, text="Processing OCR...")
        ocr_chars_total = 0
        
        for i, image in enumerate(images):
            page_text = pytesseract.image_to_string(image)
            if page_text.strip():
                ocr_text += f"\n--- OCR Page {i+1} ---\n" + page_text + "\n"
                ocr_chars_total += len(page_text.strip())
            
            progress_bar.progress((i + 1) / len(images), 
                                text=f"OCR processing page {i+1}/{len(images)}")
        
        st.write(f"🔍 **OCR Results:**")
        st.write(f"- Processed **{len(images)} pages** with OCR")
        st.write(f"- Extracted **{ocr_chars_total} additional characters**")
        
        if ocr_text.strip():
            with st.expander(f"📖 View OCR extracted text from {file.name}"):
                st.text_area("OCR Text:", ocr_text[:2000] + "..." if len(ocr_text) > 2000 else ocr_text, 
                            height=200, key=f"ocr_text_{file.name}")
        
    except Exception as e:
        st.warning(f"⚠️ OCR extraction failed for PDF: {str(e)}")
    
    os.remove(temp_file.name)
    
    # Combine both text extractions
    combined_text = pypdf_text
    if ocr_text.strip():
        combined_text += "\n\n--- OCR EXTRACTED TEXT ---\n" + ocr_text
    
    # Show combined results
    st.write(f"📊 **Final Combined Results:**")
    st.write(f"- **Total characters:** {len(combined_text.strip())}")
    st.write(f"- **PyPDF2 contribution:** {len(pypdf_text.strip())} chars")
    st.write(f"- **OCR contribution:** {len(ocr_text.strip())} chars")
    
    if combined_text.strip():
        with st.expander(f"📖 View complete combined text from {file.name}"):
            st.text_area("Combined Text:", combined_text[:2000] + "..." if len(combined_text) > 2000 else combined_text, 
                        height=300, key=f"combined_text_{file.name}")
    
    return combined_text.strip()

# ------------------ INGESTION ------------------
def ingest_files(files):
    """Ingest both PDF and image files"""
    global pdf_embeddings, file_names
    
    st.write(f"🔄 **Processing {len(files)} file(s)...**")
    
    for i, file in enumerate(files):
        st.write("---")
        st.write(f"### 📄 Processing File {i+1}/{len(files)}: {file.name}")
        
        # Determine file type and extract text accordingly
        file_extension = file.name.lower().split('.')[-1]
        
        if file_extension == 'pdf':
            st.write("📄 **Method:** PyPDF2 + OCR extraction for PDF")
            text = extract_text_from_pdf_with_ocr(file)
        elif file_extension in ['png', 'jpg', 'jpeg', 'tiff', 'bmp']:
            st.write("🖼️ **Method:** OCR extraction for image")
            text = extract_text_from_image(file)
        else:
            st.error(f"❌ Unsupported file type: {file.name}")
            continue
        
        if not text or not text.strip():
            st.error(f"❌ No text extracted from {file.name}")
            continue

        # Create one embedding per file (global representation)
        st.write("🧠 **Creating semantic embeddings...**")
        with st.spinner("Generating embeddings..."):
            emb = model.encode([text], convert_to_numpy=True).astype("float32")
            pdf_embeddings[file.name] = emb
            if file.name not in file_names:
                file_names.append(file.name)
        
        st.success(f"✅ **Successfully processed {file.name}** - Ready for search!")
    
    st.write("---")
    st.write(f"🎉 **All files processed!** Ready to search across {len(file_names)} documents.")

# ------------------ SEARCH ------------------
def search(query):
    if not pdf_embeddings:
        return []

    q_emb = model.encode([query], convert_to_numpy=True).astype("float32")

    results = []
    for fname, emb in pdf_embeddings.items():
        # cosine similarity
        sim = np.dot(q_emb, emb.T) / (np.linalg.norm(q_emb) * np.linalg.norm(emb))
        sim_score = sim[0][0]

        # scale from -1..1 → 0..100 (same as search_ai.py)
        match_percent = round(((sim_score + 1) / 2) * 100, 2)

        results.append({"file": fname, "match": match_percent, "raw_similarity": round(sim_score, 4)})

    # Sort all PDFs by similarity (descending)
    results = sorted(results, key=lambda x: x["match"], reverse=True)
    return results

# ------------------ STREAMLIT UI ------------------
st.title("📑 AI Document Search with OCR")
st.write("Upload multiple PDFs and images to find which document best matches your query. Supports OCR for both scanned PDFs and image files.")

# System Information Section
st.sidebar.header("⚙️ System Information")
if st.sidebar.button("🔍 Show System Details"):
    with st.sidebar:
        try:
            if torch.cuda.is_available():
                st.success("✅ **GPU Available**")
                st.write(f"**GPU:** {torch.cuda.get_device_name(0)}")
                st.write(f"**Memory:** {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
                st.write(f"**CUDA:** {torch.version.cuda}")
                st.write(f"**PyTorch:** {torch.__version__}")
                st.write("🤖 **Model Device:** GPU")
            else:
                st.warning("⚠️ **GPU Not Available**")
                st.write(f"**PyTorch:** {torch.__version__}")
                st.write("🤖 **Model Device:** CPU")
        except Exception as e:
            st.error(f"Error checking system: {str(e)}")
        
        st.write(f"🖥️ **CPU Cores:** {os.cpu_count()}")
        st.write("👁️ **OCR:** CPU (Tesseract)")
        
        try:
            version = pytesseract.get_tesseract_version()
            st.write(f"🔍 **Tesseract:** {version}")
        except:
            st.write("🔍 **Tesseract:** Available")

uploaded_files = st.file_uploader("📂 Upload Files", type=["pdf", "png", "jpg", "jpeg", "tiff", "bmp"], accept_multiple_files=True)
if uploaded_files:
    ingest_files(uploaded_files)
    st.success(f"✅ {len(uploaded_files)} file(s) ingested!")

st.write("---")
st.subheader("🔍 Search Your Documents")

query = st.text_input("Enter your search query:", placeholder="e.g., 'financial report', 'project timeline', 'contact information'")

if st.button("🚀 Search Documents", type="primary"):
    if query.strip() == "":
        st.warning("⚠️ Please enter a search query!")
    elif not pdf_embeddings:
        st.error("❌ No documents uploaded yet. Please upload files first.")
    else:
        with st.spinner("🔍 Searching documents..."):
            results = search(query)
        
        st.write("---")
        st.subheader("📊 Search Results")
        
        if results:
            # Show results using same logic as search_ai.py
            high_matches = []
            all_results = []
            
            for r in results:
                if r['match'] > 60:  # Same threshold as search_ai.py
                    high_matches.append(r)
                all_results.append(r)
            
            # High confidence matches (>60%)
            if high_matches:
                st.success("🎯 **Relevant Matches** (>60%)")
                for r in high_matches:
                    st.markdown(f"- **{r['file']}** — 🟢 **{r['match']}%** match (similarity: {r['raw_similarity']})")
            else:
                st.error("❌ **No relevant documents found.** Please try a different query.")
            
            # Show all results for reference
            st.info("📋 **All Documents Ranked:**")
            for r in all_results:
                if r['match'] > 60:
                    st.markdown(f"- **{r['file']}** — � **{r['match']}%** match (similarity: {r['raw_similarity']})")
                elif r['match'] > 50:
                    st.markdown(f"- **{r['file']}** — � **{r['match']}%** match (similarity: {r['raw_similarity']})")
                else:
                    st.markdown(f"- **{r['file']}** — 🔴 **{r['match']}%** match (similarity: {r['raw_similarity']})")
            
            # Overall stats
            st.write("---")
            st.write(f"📈 **Search Statistics:**")
            st.write(f"- Searched across **{len(results)} documents**")
            st.write(f"- Best match: **{results[0]['match']}%** (raw similarity: {results[0]['raw_similarity']})")
            st.write(f"- Worst match: **{results[-1]['match']}%** (raw similarity: {results[-1]['raw_similarity']})")
            st.write(f"- Query: *\"{query}\"*")
            
            # Debug info
            with st.expander("🔧 Debug Information"):
                st.write("**All Results:**")
                for r in results:
                    st.write(f"- {r['file']}: {r['match']}% (raw: {r['raw_similarity']})")
            
        else:
            st.error("❌ No results found. This shouldn't happen - please try again.")
    