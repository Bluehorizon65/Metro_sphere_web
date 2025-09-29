# api.py
from fastapi import FastAPI, UploadFile, File
from typing import List
from semantic_search_app import ingest_files_api, search, file_names
import tempfile
import shutil
import os
import json
from pydantic import BaseModel

class SearchResult(BaseModel):
    file: str
    match: float
    raw_similarity: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]

app = FastAPI(title="Semantic Search API")

@app.get("/")
def home():
    return {"message": "Home Page Mei Swagath hai"}

@app.post("/upload/")
async def upload_files(files: List[UploadFile] = File(...)):
    temp_files = []
    try:
        for file in files:
            suffix = f".{file.filename.split('.')[-1]}" if '.' in file.filename else ".tmp"
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            with open(temp_file.name, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append((temp_file.name, file.filename))
        ingest_files_api(temp_files)

        return {"status": "success", "files": file_names}
    
    except Exception as e:
        for temp_path, _ in temp_files:
            try:
                os.unlink(temp_path)
            except:
                pass
        return {"status": "error", "message": str(e)}
    
    finally:
        for temp_path, _ in temp_files:
            try:
                os.unlink(temp_path)
            except:
                pass

@app.get("/search/")
def search_docs(query: str):
    """Search across uploaded docs"""
    try:
        results_raw = search(query)
        
        results_clean = []
        for r in results_raw:
            clean_result = {
                "file": str(r["file"]),
                "match": float(str(r["match"])),  
                "raw_similarity": float(str(r["raw_similarity"]))
            }
            results_clean.append(clean_result)
        
        return {"query": str(query), "results": results_clean}
    except Exception as e:
        return {"query": str(query), "results": [], "error": str(e)}
