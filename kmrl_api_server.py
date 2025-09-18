"""
KMRL Document Analyzer FastAPI Server
====================================

A FastAPI-based REST API server for analyzing PDF documents and text using 
a fine-tuned Llama 3.2 3B model for Kochi Metro Rail Limited.

Features:
- PDF file upload and analysis
- Direct text analysis
- Health check endpoint
- Interactive API documentation
- Pydantic validation
- Error handling

Usage:
    python kmrl_api_server.py

API Endpoints:
    - GET  /           : API information
    - GET  /health     : Health check
    - POST /analyze/pdf : Upload PDF for analysis
    - POST /analyze/text : Send text for analysis
    - GET  /docs       : Interactive API documentation

Requirements:
    pip install fastapi uvicorn python-multipart PyPDF2 torch transformers peft
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import PyPDF2
import json
import tempfile
import os
import uvicorn
from typing import Optional
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Initialize FastAPI app
app = FastAPI(
    title="KMRL Document Analyzer API",
    description="AI-powered document analysis for Kochi Metro Rail Limited",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

model = None
tokenizer = None
model_loaded = False

BASE_MODEL_PATH = "llam3.2(3b)"
ADAPTER_PATH = "metro_adapter"
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
MAX_TEXT_LENGTH = 3000

class TextAnalysisRequest(BaseModel):
    text: str
    document_name: Optional[str] = "user_provided_text.txt"

class AnalysisResponse(BaseModel):
    document_name: str
    roles: Optional[list] = None
    conflict: Optional[str] = None
    department: Optional[list] = None
    task: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    summary: Optional[str] = None
    status: str = "success"

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    gpu_available: bool
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    status: str = "error"

def load_model():
    """Load the fine-tuned Llama model and tokenizer"""
    global model, tokenizer, model_loaded
    
    try:
        print("🔄 Loading base model...")
        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_PATH,
            torch_dtype=torch.float16,
            device_map={"": 0}
        )
        
        print("🔄 Loading LoRA adapter...")
        model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
        
        print("🔄 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_PATH)
        
        model.eval()
        model_loaded = True
        
        print("✅ Model loaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        model_loaded = False
        return False

def extract_text_from_pdf_bytes(pdf_bytes):
    """Extract text from PDF bytes using PyPDF2"""
    try:
        with tempfile.NamedTemporaryFile() as tmp_file:
            tmp_file.write(pdf_bytes)
            tmp_file.seek(0)
            
            pdf_reader = PyPDF2.PdfReader(tmp_file)
            text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
            return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def analyze_document_api(document_text: str):
    """Analyze document using the fine-tuned model"""
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Please check server status.")
    
    try:
        # Create the prompt
        prompt = f"""<|begin_of_text|><|start_header_id|>user<|end_header_id|>

You are an expert document analyst for Kochi Metro Rail Limited. Analyze the following document content and provide a structured JSON output with the required information.

Your output must be a single, valid JSON object with the following keys: "document_name", "roles", "conflict", "department", "task", "priority", "deadline".

Here is an example of the required format:
{{
  "document_name": "example_memo.txt",
  "roles": ["Role 1", "Role 2"],
  "conflict": "A potential conflict between Department A and Department B.",
  "department": "Department A, Department B",
  "task": "A brief description of the primary action item.",
  "priority": "High",
  "deadline": "YYYY-MM-DD or a descriptive deadline phrase",
  "summary":"A concise summary of the document content."
}}

Now, analyze the following document:

Document Content:
---
{document_text}
---<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{"""

        # Tokenize and generate
        inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
        outputs = model.generate(
            **inputs, 
            max_new_tokens=512, 
            eos_token_id=tokenizer.eos_token_id,
            do_sample=False,
            temperature=0.1
        )
        response_text = tokenizer.decode(outputs[0][len(inputs["input_ids"][0]):], skip_special_tokens=True)
        response_text = response_text.strip()
        
        # Try to parse as JSON
        try:
            parsed_result = json.loads(response_text)
            # Validate the parsed result
            if isinstance(parsed_result, dict):
                # Ensure roles is a list
                if 'roles' in parsed_result and not isinstance(parsed_result['roles'], list):
                    if isinstance(parsed_result['roles'], str):
                        parsed_result['roles'] = [parsed_result['roles']]
                    else:
                        parsed_result['roles'] = ["N/A"]
                return parsed_result
            else:
                # If it's not a dict, fall back to simple parsing
                result = parse_simple_format_api(response_text)
                return result
        except json.JSONDecodeError:
            # Parse simple format as fallback
            result = parse_simple_format_api(response_text)
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def parse_simple_format_api(text):
    """Simple parsing for the model's output format (API version)"""
    result = {}
    lines = text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if ':' in line and not line.startswith('{') and not line.startswith('}'):
            parts = line.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip().replace('"', '').replace('-', '').strip()
                value = parts[1].strip().rstrip(',').strip()
                
                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                
                # Skip malformed or empty values
                if not value or value in ['[', ']', '["]', '[""]', 'N/A', 'null', 'None']:
                    continue
                
                # Handle roles field specially
                if key == 'roles':
                    if value.startswith('[') and value.endswith(']'):
                        try:
                            parsed_roles = json.loads(value)
                            if isinstance(parsed_roles, list) and parsed_roles and parsed_roles != ['']:
                                result[key] = [r for r in parsed_roles if r and r != '']
                        except:
                            # Manual parsing for malformed JSON
                            roles_content = value.strip('[]').strip()
                            if roles_content:
                                roles_list = [r.strip('"').strip() for r in roles_content.split(',')]
                                roles_list = [r for r in roles_list if r and r != '']
                                if roles_list:
                                    result[key] = roles_list
                    else:
                        # Single role
                        if value and value not in ['N/A', 'null', 'None']:
                            result[key] = [value]
                
                # Handle department field as list
                elif key == 'department':
                    if value and value not in ['N/A', 'null', 'None']:
                        # Split by common separators and clean
                        dept_parts = [d.strip() for d in value.replace(' and ', ', ').split(',')]
                        dept_parts = [d for d in dept_parts if d and d not in ['N/A', 'null', 'None']]
                        if dept_parts:
                            result[key] = dept_parts
                
                # Handle other fields
                else:
                    if value and value not in ['N/A', 'null', 'None', 'No conflict described.']:
                        result[key] = value
    
    return result

# API Routes
@app.get("/")
async def root():
    """API Information and available endpoints"""
    return {
        "message": "KMRL Document Analyzer API",
        "version": "1.0.0",
        "description": "AI-powered document analysis for Kochi Metro Rail Limited",
        "model_status": "loaded" if model_loaded else "not loaded",
        "endpoints": {
            "GET /": "API information",
            "GET /health": "Health check",
            "POST /analyze/pdf": "Upload PDF for analysis",
            "POST /analyze/text": "Send text for analysis",
            "GET /docs": "Interactive API documentation",
            "GET /redoc": "Alternative API documentation"
        },
        "usage": {
            "pdf_analysis": "POST /analyze/pdf with multipart/form-data file upload",
            "text_analysis": "POST /analyze/text with JSON body containing 'text' field",
            "max_file_size": "16MB",
            "supported_formats": ["PDF"],
            "output_format": "Structured JSON with document analysis"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify server and model status"""
    try:
        # Check if model is loaded
        if not model_loaded:
            return HealthResponse(
                status="unhealthy",
                model_loaded=False,
                gpu_available=torch.cuda.is_available(),
                message="Model not loaded"
            )
        
        # Quick model test
        test_result = tokenizer.encode("test", return_tensors="pt")
        
        return HealthResponse(
            status="healthy",
            model_loaded=True,
            gpu_available=torch.cuda.is_available(),
            message="All systems operational"
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            model_loaded=model_loaded,
            gpu_available=torch.cuda.is_available(),
            message=f"Health check failed: {str(e)}"
        )

@app.post("/analyze/pdf", response_model=AnalysisResponse)
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Analyze PDF document
    
    Upload a PDF file to get structured analysis including:
    - Document name, roles, departments
    - Tasks, priorities, deadlines
    - Potential conflicts and summary
    
    **Parameters:**
    - **file**: PDF file to analyze (max 16MB)
    
    **Returns:**
    - Structured JSON analysis of the document
    """
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Check file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB")
    
    try:
        # Read PDF content
        pdf_bytes = await file.read()
        
        # Extract text
        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)
        
        if not extracted_text or len(extracted_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        # Truncate if too long
        if len(extracted_text) > MAX_TEXT_LENGTH:
            extracted_text = extracted_text[:MAX_TEXT_LENGTH] + "..."
        
        # Analyze with model
        result = analyze_document_api(extracted_text)
        
        # Ensure response structure is valid for Pydantic model
        validated_result = {
            "document_name": str(result.get('document_name', file.filename)),
            "roles": result.get('roles') if isinstance(result.get('roles'), list) and result.get('roles') else None,
            "conflict": result.get('conflict') if result.get('conflict') else None,
            "department": result.get('department') if isinstance(result.get('department'), list) and result.get('department') else None,
            "task": result.get('task') if result.get('task') else None,
            "priority": result.get('priority') if result.get('priority') else None,
            "deadline": result.get('deadline') if result.get('deadline') else None,
            "summary": result.get('summary') if result.get('summary') else None,
            "status": "success"
        }
        
        return validated_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/analyze/text", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text document
    
    Send raw text content for analysis to get structured information.
    
    **Parameters:**
    - **text**: Text content to analyze (required)
    - **document_name**: Optional document name for reference
    
    **Returns:**
    - Structured JSON analysis of the text
    """
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text content cannot be empty")
    
    # Truncate if too long
    text_to_analyze = request.text
    if len(text_to_analyze) > MAX_TEXT_LENGTH:
        text_to_analyze = text_to_analyze[:MAX_TEXT_LENGTH] + "..."
    
    try:
        # Analyze with model
        result = analyze_document_api(text_to_analyze)
        
        # Ensure response structure is valid for Pydantic model
        validated_result = {
            "document_name": str(result.get('document_name', request.document_name)),
            "roles": result.get('roles') if isinstance(result.get('roles'), list) and result.get('roles') else None,
            "conflict": result.get('conflict') if result.get('conflict') else None,
            "department": result.get('department') if isinstance(result.get('department'), list) and result.get('department') else None,
            "task": result.get('task') if result.get('task') else None,
            "priority": result.get('priority') if result.get('priority') else None,
            "deadline": result.get('deadline') if result.get('deadline') else None,
            "summary": result.get('summary') if result.get('summary') else None,
            "status": "success"
        }
        
        return validated_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze/pdf-form")
async def analyze_pdf_form(file: UploadFile = File(...)):
    """
    Alternative PDF analysis endpoint for form-based uploads
    Returns JSON response suitable for web forms
    """
    try:
        result = await analyze_pdf(file)
        return JSONResponse(content=result.dict())
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail, "status": "error"}
        )

# Optional CORS middleware (uncomment if needed for web access)
# from fastapi.middleware.cors import CORSMiddleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Configure as needed for security
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

def main():
    """Main function to start the server"""
    print("🚀 KMRL Document Analyzer FastAPI Server")
    print("=" * 50)
    
    # Load the model first
    print("🔄 Loading AI model...")
    if not load_model():
        print("❌ Failed to load model. Server will start but analysis endpoints will not work.")
        print("Please check that the model files exist at:")
        print(f"   - Base model: {BASE_MODEL_PATH}")
        print(f"   - Adapter: {ADAPTER_PATH}")
    
    print("\n📍 Server will be available at:")
    print("   - Main API: http://localhost:8000")
    print("   - Interactive Docs: http://localhost:8000/docs")
    print("   - Alternative Docs: http://localhost:8000/redoc")
    print("   - Health Check: http://localhost:8000/health")
    
    print("\n🔗 API Endpoints:")
    print("   - POST /analyze/pdf  (PDF file upload)")
    print("   - POST /analyze/text (Text analysis)")
    print("   - GET  /health       (Health check)")
    
    print("\n💡 Usage Examples:")
    print("   - Upload PDF: curl -X POST 'http://localhost:8000/analyze/pdf' -F 'file=@document.pdf'")
    print("   - Health check: curl http://localhost:8000/health")
    print("   - Interactive docs: Open http://localhost:8000/docs in browser")
    
    print("\n⚡ Starting server...")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start the server
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()