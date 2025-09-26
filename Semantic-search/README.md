# Semantic PDF Search API

A FastAPI-based server for semantic search across PDF documents using sentence transformers.

## Installation

1. Install required packages:
```bash
pip install -r requirements.txt
```

## Running the Server

To start the server:
```bash
python api.py
```

Or using uvicorn directly:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at: http://localhost:8000

## API Endpoints

### 1. Root Endpoint
- **GET** `/` - API information and available endpoints

### 2. Upload PDFs
- **POST** `/upload`
- Upload multiple PDF files for indexing
- Content-Type: `multipart/form-data`
- Body: PDF files with field name `files`

Example using curl:
```bash
curl -X POST "http://localhost:8000/upload" -F "files=@document1.pdf" -F "files=@document2.pdf"
```

### 3. Search PDFs
- **POST** `/search`
- Search through uploaded PDFs using semantic similarity
- Content-Type: `application/json`
- Body: `{"query": "your search query"}`

Example using curl:
```bash
curl -X POST "http://localhost:8000/search" -H "Content-Type: application/json" -d '{"query": "artificial intelligence"}'
```

### 4. List Files
- **GET** `/files` - List all uploaded PDF files

### 5. Clear Files
- **DELETE** `/clear` - Clear all uploaded files and embeddings

## API Documentation

Once the server is running, you can access:
- Interactive API docs: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

## Response Format

### Search Response
```json
{
  "query": "your search query",
  "message": "Found X relevant document(s)",
  "results": [
    {
      "file": "document.pdf",
      "match": 85.5
    }
  ],
  "relevant_results": [
    {
      "file": "document.pdf", 
      "match": 85.5
    }
  ]
}
```

## Features

- **Semantic Search**: Uses sentence-transformers for meaningful similarity matching
- **Multi-file Upload**: Process multiple PDFs at once
- **Relevance Filtering**: Only returns documents with >60% match score as relevant
- **RESTful API**: Standard HTTP methods and JSON responses
- **Auto Documentation**: Swagger/OpenAPI docs automatically generated

## Notes

- Files are stored in memory during server runtime
- Server supports hot reloading during development
- All PDFs are processed for semantic similarity, not keyword matching