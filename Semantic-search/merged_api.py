# merged_api.py
from fastapi import FastAPI, UploadFile, File
from typing import List
import tempfile
import shutil
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import torch
from pydantic import BaseModel
import faiss
import pickle
import json
import hashlib
from datetime import datetime
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ------------------ FAISS VECTOR DATABASE ------------------
class VectorDB:
    def __init__(self, db_path="vector_db", dimension=384):
        self.db_path = Path(db_path)
        self.db_path.mkdir(exist_ok=True)
        self.dimension = dimension
        self.index_path = self.db_path / "faiss_index.bin"
        self.metadata_path = self.db_path / "metadata.json"
        self.file_hashes_path = self.db_path / "file_hashes.json"
        
        # Initialize FAISS index
        self.index = None
        self.metadata = {}  # {doc_id: {"filename": str, "text": str, "created_at": str}}
        self.file_hashes = {}  # {filename: hash}
        self.doc_counter = 0
        
        self.load_or_create_index()
    
    def load_or_create_index(self):
        """Load existing index or create new one"""
        if self.index_path.exists() and self.metadata_path.exists():
            try:
                # Load FAISS index
                self.index = faiss.read_index(str(self.index_path))
                
                # Load metadata
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)
                
                # Load file hashes
                if self.file_hashes_path.exists():
                    with open(self.file_hashes_path, 'r', encoding='utf-8') as f:
                        self.file_hashes = json.load(f)
                
                self.doc_counter = len(self.metadata)
                print(f"📚 Loaded existing vector database with {self.doc_counter} documents")
            except Exception as e:
                print(f"⚠️ Error loading existing database: {e}")
                self.create_new_index()
        else:
            self.create_new_index()
    
    def create_new_index(self):
        """Create a new FAISS index"""
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner Product (cosine similarity)
        self.metadata = {}
        self.file_hashes = {}
        self.doc_counter = 0
        print("🆕 Created new vector database")
    
    def get_file_hash(self, file_path):
        """Get MD5 hash of file for change detection"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def file_needs_processing(self, file_path):
        """Check if file needs to be processed (new or changed)"""
        filename = os.path.basename(file_path)
        current_hash = self.get_file_hash(file_path)
        
        if filename not in self.file_hashes:
            return True  # New file
        
        return self.file_hashes[filename] != current_hash  # Changed file
    
    def add_document(self, filename, text, embedding):
        """Add a document to the vector database"""
        # Normalize embedding for cosine similarity
        embedding = embedding / np.linalg.norm(embedding)
        
        # Add to FAISS index
        self.index.add(embedding.reshape(1, -1).astype('float32'))
        
        # Store metadata
        doc_id = self.doc_counter
        self.metadata[str(doc_id)] = {
            "filename": filename,
            "text": text[:1000] + "..." if len(text) > 1000 else text,  # Store preview
            "created_at": datetime.now().isoformat()
        }
        
        # Update file hash
        self.file_hashes[filename] = self.get_file_hash(f"pdfs/{filename}") if os.path.exists(f"pdfs/{filename}") else "uploaded"
        
        self.doc_counter += 1
        
        print(f"➕ Added document: {filename} (ID: {doc_id})")
        
    def save_index(self):
        """Save FAISS index and metadata to disk"""
        try:
            # Save FAISS index
            faiss.write_index(self.index, str(self.index_path))
            
            # Save metadata
            with open(self.metadata_path, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, ensure_ascii=False, indent=2)
            
            # Save file hashes
            with open(self.file_hashes_path, 'w', encoding='utf-8') as f:
                json.dump(self.file_hashes, f, indent=2)
            
            print(f"💾 Saved vector database with {len(self.metadata)} documents")
        except Exception as e:
            print(f"❌ Error saving database: {e}")
    
    def search(self, query_embedding, k=10, threshold=0.6):
        """Search for similar documents"""
        if self.index.ntotal == 0:
            return []
        
        # Normalize query embedding
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        
        # Search FAISS index
        scores, indices = self.index.search(query_embedding.reshape(1, -1).astype('float32'), k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:  # FAISS returns -1 for invalid indices
                continue
            
            # Since we're using IndexFlatIP with normalized embeddings, 
            # the score is already cosine similarity (-1 to 1)
            # Convert to percentage (0 to 100)
            match_percent = round(((score + 1) / 2) * 100, 2)
            
            if match_percent >= threshold * 100:
                doc_info = self.metadata.get(str(idx), {})
                results.append({
                    "file": doc_info.get("filename", f"Document_{idx}"),
                    "match": match_percent,
                    "raw_similarity": round(float(score), 4),
                    "doc_id": idx
                })
        
        return sorted(results, key=lambda x: x["match"], reverse=True)
    
    def search_debug(self, query_embedding, k=10):
        """Debug version that returns all results regardless of threshold"""
        if self.index.ntotal == 0:
            return []
        
        # Normalize query embedding
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        
        # Search FAISS index
        scores, indices = self.index.search(query_embedding.reshape(1, -1).astype('float32'), k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:  # FAISS returns -1 for invalid indices
                continue
            
            # Convert cosine similarity to percentage
            match_percent = round(((score + 1) / 2) * 100, 2)
            
            doc_info = self.metadata.get(str(idx), {})
            results.append({
                "file": doc_info.get("filename", f"Document_{idx}"),
                "match": match_percent,
                "raw_similarity": round(float(score), 4),
                "doc_id": idx,
                "text_preview": doc_info.get("text", "No preview available")[:200] + "..."
            })
        
        return sorted(results, key=lambda x: x["match"], reverse=True)
    
    def get_stats(self):
        """Get database statistics"""
        return {
            "total_documents": self.index.ntotal if self.index else 0,
            "document_names": [meta["filename"] for meta in self.metadata.values()],
            "dimension": self.dimension,
            "db_path": str(self.db_path)
        }

# ------------------ PDF FILE WATCHER ------------------
class PDFHandler(FileSystemEventHandler):
    def __init__(self, vector_db, model_getter):
        self.vector_db = vector_db
        self.get_model = model_getter
    
    def on_created(self, event):
        if not event.is_directory and event.src_path.lower().endswith('.pdf'):
            print(f"📄 New PDF detected: {event.src_path}")
            self.process_pdf(event.src_path)
    
    def on_modified(self, event):
        if not event.is_directory and event.src_path.lower().endswith('.pdf'):
            filename = os.path.basename(event.src_path)
            if self.vector_db.file_needs_processing(event.src_path):
                print(f"📝 PDF modified: {event.src_path}")
                self.process_pdf(event.src_path)
    
    def process_pdf(self, file_path):
        try:
            filename = os.path.basename(file_path)
            if self.vector_db.file_needs_processing(file_path):
                print(f"🔄 Processing: {filename}")
                text = extract_text_from_pdf_api(file_path)
                if text.strip():
                    model = self.get_model()
                    embedding = model.encode([text], convert_to_numpy=True)[0]
                    self.vector_db.add_document(filename, text, embedding)
                    self.vector_db.save_index()
                    print(f"✅ Successfully processed: {filename}")
                else:
                    print(f"⚠️ No text extracted from: {filename}")
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")

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
def load_model():
    """Load the SentenceTransformer model"""
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

# Global model instance - will be loaded lazily
model = None

# ------------------ GLOBAL STORAGE ------------------
# Initialize vector database
vector_db = VectorDB(db_path="vector_db", dimension=384)  # MiniLM model has 384 dimensions
file_watcher = None
observer = None

def get_model():
    """Get or load the model (lazy loading)"""
    global model
    if model is None:
        model = load_model()
    return model

# ------------------ PDF TEXT EXTRACTION ------------------
def extract_text_from_pdf_api(file_path):
    """API version of PDF text extraction without Streamlit dependencies"""
    reader = PdfReader(file_path)
    pypdf_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            pypdf_text += txt + "\n"
    
    print(f"📄 PyPDF2 Results: Found {len(reader.pages)} pages, extracted {len(pypdf_text.strip())} characters")
    
    # OCR extraction
    ocr_text = ""
    try:
        print("🔄 Converting PDF to images for OCR...")
        # Limit to first 3 pages for performance
        images = convert_from_path(file_path, first_page=1, last_page=min(3, len(reader.pages)))
        
        ocr_chars_total = 0
        for i, image in enumerate(images):
            page_text = pytesseract.image_to_string(image)
            if page_text.strip():
                ocr_text += f"\n--- OCR Page {i+1} ---\n" + page_text + "\n"
                ocr_chars_total += len(page_text.strip())
        
        print(f"🔍 OCR Results: Processed {len(images)} pages, extracted {ocr_chars_total} additional characters")
        
    except Exception as e:
        print(f"⚠️ OCR extraction failed for PDF: {str(e)}")
    
    # Combine both text extractions
    combined_text = pypdf_text
    if ocr_text.strip():
        combined_text += "\n\n--- OCR EXTRACTED TEXT ---\n" + ocr_text
    
    print(f"📊 Final Results: Total {len(combined_text.strip())} characters")
    return combined_text.strip()

def extract_text_from_image_api(file_path):
    """API version of image text extraction without Streamlit dependencies"""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        
        print(f"🖼️ OCR Results: Extracted {len(text.strip())} characters")
        
        if not text.strip():
            print("⚠️ No text found in image")
        
        return text.strip()
    except Exception as e:
        print(f"❌ Error extracting text from image: {str(e)}")
        return ""

# ------------------ INGESTION ------------------
def ingest_files_api(file_paths_and_names):
    """API-compatible version of ingest_files that works without Streamlit"""
    global pdf_embeddings, file_names
    
    print(f"🔄 Processing {len(file_paths_and_names)} file(s)...")
    
    for i, (file_path, original_name) in enumerate(file_paths_and_names):
        print(f"📄 Processing File {i+1}/{len(file_paths_and_names)}: {original_name}")
        
        # Determine file type and extract text accordingly
        file_extension = original_name.lower().split('.')[-1]
        
        if file_extension == 'pdf':
            print("📄 Method: PyPDF2 + OCR extraction for PDF")
            text = extract_text_from_pdf_api(file_path)
        elif file_extension in ['png', 'jpg', 'jpeg', 'tiff', 'bmp']:
            print("🖼️ Method: OCR extraction for image")
            text = extract_text_from_image_api(file_path)
        else:
            print(f"❌ Unsupported file type: {original_name}")
            continue
        
        if not text or not text.strip():
            print(f"❌ No text extracted from {original_name}")
            continue

        # Create one embedding per file (global representation)
        print("🧠 Creating semantic embeddings...")
        emb = get_model().encode([text], convert_to_numpy=True).astype("float32")
        pdf_embeddings[original_name] = emb
        if original_name not in file_names:
            file_names.append(original_name)
        
        print(f"✅ Successfully processed {original_name} - Ready for search!")
    
    print(f"🎉 All files processed! Ready to search across {vector_db.get_stats()['total_documents']} documents.")

# ------------------ PDF DIRECTORY MANAGEMENT ------------------
def initialize_pdf_directory():
    """Initialize PDF directory monitoring and process existing PDFs"""
    global file_watcher, observer
    
    pdf_dir = Path("pdfs")
    pdf_dir.mkdir(exist_ok=True)
    
    print(f"📁 Scanning PDF directory: {pdf_dir.absolute()}")
    
    # Process existing PDFs
    pdf_files = list(pdf_dir.glob("*.pdf"))
    print(f"📄 Found {len(pdf_files)} PDF files")
    
    for pdf_file in pdf_files:
        try:
            if vector_db.file_needs_processing(str(pdf_file)):
                print(f"🔄 Processing: {pdf_file.name}")
                text = extract_text_from_pdf_api(str(pdf_file))
                if text.strip():
                    model = get_model()
                    embedding = model.encode([text], convert_to_numpy=True)[0]
                    vector_db.add_document(pdf_file.name, text, embedding)
                    print(f"✅ Processed: {pdf_file.name}")
                else:
                    print(f"⚠️ No text extracted from: {pdf_file.name}")
            else:
                print(f"⏭️ Already processed: {pdf_file.name}")
        except Exception as e:
            print(f"❌ Error processing {pdf_file.name}: {e}")
    
    # Save the database
    vector_db.save_index()
    
    # Set up file watcher
    file_watcher = PDFHandler(vector_db, get_model)
    observer = Observer()
    observer.schedule(file_watcher, str(pdf_dir), recursive=False)
    observer.start()
    
    print(f"👁️ Started monitoring {pdf_dir} for new/changed PDFs")
    print(f"📊 Database ready with {vector_db.get_stats()['total_documents']} documents")

def get_file_names():
    """Get list of document names from vector database"""
    return vector_db.get_stats()['document_names']

# ------------------ SEARCH ------------------
def convert_to_json_serializable(obj):
    """Convert numpy types to JSON serializable Python types"""
    if hasattr(obj, 'dtype') and 'numpy' in str(type(obj)):
        return float(obj)
    return obj

def search(query):
    if vector_db.get_stats()['total_documents'] == 0:
        return [{"message": "No documents found try different search query"}]

    # Get query embedding
    q_emb = get_model().encode([query], convert_to_numpy=True)
    
    # Search using FAISS with proper 60% threshold
    results = vector_db.search(q_emb[0], k=20, threshold=0.6)  # 60% threshold as required
    
    # If no good matches found, return a message
    if not results:
        return [{"message": "No documents found try different search query"}]

    return results

# ------------------ PYDANTIC MODELS ------------------
class SearchResult(BaseModel):
    file: str
    match: float
    raw_similarity: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]

# ------------------ FASTAPI APP ------------------
app = FastAPI(title="Semantic Search API", description="AI Document Search with OCR")

@app.get("/")
def home():
    return {"message": "AI Document Search API - Upload documents and search with semantic queries"}

@app.post("/upload/")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload and process PDF and image files for semantic search"""
    temp_files = []
    processed_files = []
    try:
        for file in files:
            suffix = f".{file.filename.split('.')[-1]}" if '.' in file.filename else ".tmp"
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            with open(temp_file.name, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append((temp_file.name, file.filename))
        
        # Process files and add to vector database
        for temp_path, filename in temp_files:
            try:
                print(f"🔄 Processing uploaded file: {filename}")
                
                file_extension = filename.lower().split('.')[-1]
                if file_extension == 'pdf':
                    text = extract_text_from_pdf_api(temp_path)
                elif file_extension in ['png', 'jpg', 'jpeg', 'tiff', 'bmp']:
                    text = extract_text_from_image_api(temp_path)
                else:
                    continue
                
                if text.strip():
                    model = get_model()
                    embedding = model.encode([text], convert_to_numpy=True)[0]
                    vector_db.add_document(filename, text, embedding)
                    processed_files.append(filename)
                    print(f"✅ Successfully processed: {filename}")
                else:
                    print(f"⚠️ No text extracted from: {filename}")
                    
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")
        
        # Save the updated database
        vector_db.save_index()

        stats = vector_db.get_stats()
        return {
            "status": "success", 
            "message": f"Successfully processed {len(processed_files)} files",
            "processed_files": processed_files,
            "total_documents": stats['total_documents'],
            "all_documents": stats['document_names']
        }
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
    finally:
        for temp_path, _ in temp_files:
            try:
                os.unlink(temp_path)
            except:
                pass

@app.get("/search/")
def search_docs(query: str):
    """Search across uploaded documents using semantic similarity with FAISS vector database"""
    try:
        if not query.strip():
            return {"query": query, "results": [], "error": "Query cannot be empty"}
        
        stats = vector_db.get_stats()
        if stats['total_documents'] == 0:
            return {"query": query, "results": [], "error": "No documents uploaded yet"}
        
        results_raw = search(query)
        
        # Check if no documents found (threshold-based filtering)
        if len(results_raw) == 1 and "message" in results_raw[0]:
            return {
                "query": str(query), 
                "results": [],
                "message": results_raw[0]["message"],
                "metadata": {
                    "total_documents_searched": stats['total_documents'],
                    "high_confidence_matches": 0,
                    "best_match_score": 0,
                    "threshold_used": 60,
                    "database_info": {
                        "using_vector_db": True,
                        "db_path": stats['db_path']
                    }
                }
            }
        
        results_clean = []
        for r in results_raw:
            clean_result = {
                "file": str(r["file"]),
                "match": float(r["match"]),  
                "raw_similarity": float(r["raw_similarity"])
            }
            results_clean.append(clean_result)
        
        # Add metadata about search results
        high_matches = [r for r in results_clean if r["match"] > 60]
        
        return {
            "query": str(query), 
            "results": results_clean,
            "metadata": {
                "total_documents_searched": stats['total_documents'],
                "high_confidence_matches": len(high_matches),
                "best_match_score": results_clean[0]["match"] if results_clean else 0,
                "threshold_used": 60,
                "database_info": {
                    "using_vector_db": True,
                    "db_path": stats['db_path'],
                    "dimension": stats['dimension']
                }
            }
        }
    except Exception as e:
        return {"query": str(query), "results": [], "error": str(e)}

@app.get("/status/")
def get_status():
    """Get current status of the search system"""
    stats = vector_db.get_stats()
    return {
        "documents_loaded": stats['total_documents'],
        "document_names": stats['document_names'],
        "model_loaded": model is not None,
        "vector_database": {
            "using_faiss": True,
            "db_path": stats['db_path'],
            "dimension": stats['dimension'],
            "total_documents": stats['total_documents']
        },
        "system_info": {
            "cuda_available": torch.cuda.is_available(),
            "cpu_count": os.cpu_count()
        },
        "monitoring": {
            "pdf_directory_watcher": observer is not None and observer.is_alive() if observer else False,
            "pdf_directory": "pdfs/"
        }
    }

@app.delete("/documents/")
def clear_documents():
    """Clear all uploaded documents and embeddings"""
    try:
        vector_db.create_new_index()
        vector_db.save_index()
        return {"status": "success", "message": "All documents cleared from vector database"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/search/debug/")
def search_debug_endpoint(query: str):
    """Debug search to see all similarity scores regardless of threshold"""
    try:
        if not query.strip():
            return {"query": query, "error": "Query cannot be empty"}
        
        stats = vector_db.get_stats()
        if stats['total_documents'] == 0:
            return {"query": query, "error": "No documents uploaded yet"}
        
        # Get query embedding
        q_emb = get_model().encode([query], convert_to_numpy=True)
        
        # Debug search (no filtering)
        results = vector_db.search_debug(q_emb[0], k=20)
        
        return {
            "query": str(query), 
            "debug_results": results,
            "total_documents": stats['total_documents'],
            "document_names": stats['document_names']
        }
    except Exception as e:
        return {"query": str(query), "error": str(e)}

@app.on_event("startup")
async def startup_event():
    """Initialize the system on startup"""
    print("🚀 Starting Semantic Search API with FAISS Vector Database")
    initialize_pdf_directory()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global observer
    if observer:
        observer.stop()
        observer.join()
        print("🛑 Stopped PDF directory monitoring")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)