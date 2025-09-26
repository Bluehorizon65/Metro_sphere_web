import tempfile
import os
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from typing import List
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
from pydantic import BaseModel
import uvicorn
from sklearn.metrics.pairwise import cosine_similarity

# ------------------ FASTAPI APP ------------------
app = FastAPI(title="Semantic PDF Search API", version="1.0.0")

# ------------------ MODEL LOAD ------------------
print("Loading SentenceTransformer model...")
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# ------------------ PYDANTIC MODELS ------------------
class SearchQuery(BaseModel):
    query: str

class UploadResponse(BaseModel):
    message: str
    files_processed: int
    files_list: List[str]

# ------------------ GLOBAL STORAGE ------------------
pdf_embeddings = {}   # {filename: embedding}
file_names = []

# ------------------ PDF TEXT EXTRACTION ------------------
def extract_text_from_pdf(file_content: bytes, filename: str):
    """Extract text from PDF file content"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        temp_file.write(file_content)
        temp_file.close()

        reader = PdfReader(temp_file.name)
        text = ""
        for page in reader.pages:
            txt = page.extract_text()
            if txt:
                text += txt + "\n"
        
        print(f"Extracted {len(text)} characters from {filename}")
        return text.strip()
        
    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
        return ""
    finally:
        try:
            os.remove(temp_file.name)
        except:
            pass

# ------------------ INGESTION ------------------
async def ingest_pdfs(files):
    """Process uploaded PDF files and create embeddings"""
    global pdf_embeddings, file_names
    
    for file in files:
        try:
            print(f"Processing file: {file.filename}")
            
            # Read file content
            file_content = await file.read()
            filename = file.filename
            
            # Extract text
            text = extract_text_from_pdf(file_content, filename)
            if not text:
                print(f"Warning: No text extracted from {filename}")
                continue

            # Create embedding
            print(f"Creating embedding for {filename}...")
            emb = model.encode([text])  # Simplified - no numpy conversion yet
            pdf_embeddings[filename] = emb
            
            if filename not in file_names:
                file_names.append(filename)
                
            print(f"Successfully processed: {filename}")
            
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            import traceback
            traceback.print_exc()
            continue

# ------------------ SEARCH (SIMPLIFIED) ------------------
def search(query):
    """Perform semantic search across uploaded PDFs"""
    try:
        print(f"Search function called with query: '{query}'")
        print(f"Available embeddings: {list(pdf_embeddings.keys())}")
        
        if not pdf_embeddings:
            print("No embeddings available")
            return []

        if not model:
            raise Exception("Model not loaded")

        # Create query embedding
        print("Creating query embedding...")
        query_emb = model.encode([query])
        print(f"Query embedding created successfully")

        results = []
        for fname, doc_emb in pdf_embeddings.items():
            print(f"Calculating similarity for {fname}")
            
            # Use cosine similarity from sklearn (more reliable)
            try:
                similarity = cosine_similarity(query_emb, doc_emb)[0][0]
                # Convert to percentage (0-100)
                match_percent = round(similarity * 100, 2)
                
                print(f"Similarity for {fname}: {similarity:.4f} -> {match_percent}%")
                results.append({"file": fname, "match": match_percent})
                
            except Exception as e:
                print(f"Error calculating similarity for {fname}: {e}")
                # Fallback to 0% match
                results.append({"file": fname, "match": 0.0})

        # Sort by similarity (descending)
        results = sorted(results, key=lambda x: x["match"], reverse=True)
        print(f"Search completed, returning {len(results)} results")
        return results
        
    except Exception as e:
        print(f"Error in search function: {e}")
        import traceback
        traceback.print_exc()
        raise e

# ------------------ ENDPOINTS ------------------

@app.get("/")
async def root():
    return {
        "message": "Semantic PDF Search API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /upload - Upload PDF files",
            "search": "POST /search - Search through uploaded PDFs",
            "files": "GET /files - List uploaded files",
            "clear": "DELETE /clear - Clear all uploaded files"
        }
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """Upload multiple PDF files for semantic search"""
    try:
        print(f"Upload endpoint called with {len(files)} files")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        if not model:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        # Validate file types
        pdf_files = []
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
            pdf_files.append(file)
        
        # Process PDFs
        await ingest_pdfs(pdf_files)
        
        print(f"Upload completed. Total files now: {len(file_names)}")
        
        return UploadResponse(
            message=f"Successfully processed {len(pdf_files)} PDF file(s)",
            files_processed=len(pdf_files),
            files_list=file_names.copy()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.post("/search")
async def search_pdfs(query_data: SearchQuery):
    """Search through uploaded PDFs using semantic similarity"""
    try:
        print(f"Search endpoint called with query: '{query_data.query}'")
        
        if not query_data.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        if not model:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        if not pdf_embeddings:
            raise HTTPException(status_code=400, detail="No PDFs uploaded. Please upload PDFs first.")
        
        results = search(query_data.query)
        
        # Filter results with match > 60% (high relevance)
        relevant_results = [r for r in results if r['match'] > 60]
        
        response_data = {
            "query": query_data.query,
            "message": f"Found {len(relevant_results)} relevant document(s)" if relevant_results else "No relevant documents found. Please try a different query.",
            "results": results,
            "relevant_results": relevant_results
        }
        
        print(f"Returning search results: {len(results)} total, {len(relevant_results)} relevant")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Search error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error during search: {str(e)}")

@app.get("/files")
async def list_files():
    """List all uploaded PDF files"""
    return {
        "uploaded_files": file_names.copy(),
        "total_files": len(file_names)
    }

@app.delete("/clear")
async def clear_files():
    """Clear all uploaded files and embeddings"""
    global pdf_embeddings, file_names
    pdf_embeddings.clear()
    file_names.clear()
    print("All files cleared")
    return {"message": "All files cleared successfully"}

# ------------------ SERVER STARTUP ------------------
if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )