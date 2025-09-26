# SIH_Bravo-6-Web-
SIH 2025 WEB

# KMRL Document Analyzer API

A FastAPI-based REST API server for analyzing PDF documents and text using a fine-tuned Llama 3.2 3B model for Kochi Metro Rail Limited.

## Features

- 📄 **PDF Analysis**: Upload PDF files and get structured analysis
- 📝 **Text Analysis**: Send raw text for document analysis
- 🏥 **Health Checks**: Monitor server and model status
- 📚 **Interactive Docs**: Built-in Swagger UI documentation
- ✅ **Validation**: Pydantic models for request/response validation
- 🛡️ **Error Handling**: Comprehensive error handling and logging

## Quick Start

### download the adapter file
`download form this hugginface repo thinkingnew/metro_adapter`

link - https://huggingface.co/thinkingnew/metro_adapter

## how to integrate this with the web application (`Important`)

create a upload based page where the person can upload the pdf then it will extract the text or the person can also like directly put text

it will extract give the output in 

```json
{
  "document_name": "document.pdf",
  "roles": ["Role 1", "Role 2"],
  "conflict": "Description or null",
  "department": "Department name",
  "task": "Task description",
  "priority": "High/Medium/Low",
  "deadline": "Date or description",
  "summary": "Document summary",
  "status": "success"
}
```
`if any one of the value does not exist then it will give None that is how the system should compare like if not None then do the following mention things `
`use the value from departement to create pop up like whether u want to send to this departement in that webpage`
`use the value from priority if == High then automaticaly add to notification tab  the task value if the priority is not high then ask the user if we want to add`
`if the user is adding the task to the notification tab then add the deadline also if if the deadline value is not=None`
`give the value of the summary directly in the chat to the user`
`ensure to send all the values properly like string sperated to the department group along with file`
`ensure to keep a db for storing the pdf files `



### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install fastapi uvicorn python-multipart PyPDF2 torch transformers peft requests
```

### Download Base Model

```python
from huggingface_hub import snapshot_download
repo_id = "NousResearch/Hermes-3-Llama-3.2-3B"
download_dir = "./llam3.2(3b)"
snapshot_download(repo_id, local_dir=download_dir)
```

### 2. Prepare Model Files

Make sure you have your model files in the correct locations:
- Base model: `llam3.2(3b)/`
- LoRA adapter: `metro_adapter/`
- make sure to attach the adapter file to base model
### 3. Start the Server

```bash
python kmrl_api_server.py
```

The server will start on `http://localhost:8000`

### 4. Test the API

```bash
python test_client.py
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information and available endpoints |
| GET | `/health` | Health check and server status |
| POST | `/analyze/pdf` | Upload PDF file for analysis |
| POST | `/analyze/text` | Send text content for analysis |
| GET | `/docs` | Interactive API documentation (Swagger UI) |
| GET | `/redoc` | Alternative API documentation |

## Usage Examples

### Health Check
```bash
curl http://localhost:8000/health
```

### PDF Analysis
```bash
curl -X POST "http://localhost:8000/analyze/pdf" \
  -F "file=@document.pdf"
```

### Text Analysis
```bash
curl -X POST "http://localhost:8000/analyze/text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your document text here...",
    "document_name": "memo.txt"
  }'
```

### Python Client Example
```python
import requests

# Text analysis
response = requests.post(
    'http://localhost:8000/analyze/text',
    json={
        "text": "Your document text here...",
        "document_name": "memo.txt"
    }
)
result = response.json()
print(result)

# PDF analysis
with open('document.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/analyze/pdf',
        files={'file': f}
    )
    result = response.json()
    print(result)
```

## Response Format

The API returns structured JSON with the following fields:

```json
{
  "document_name": "document.pdf",
  "roles": ["Role 1", "Role 2"],
  "conflict": "Description or null",
  "department": "Department name",
  "task": "Task description",
  "priority": "High/Medium/Low",
  "deadline": "Date or description",
  "summary": "Document summary",
  "status": "success"
}
```

## Interactive Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive documentation where you can test the API endpoints directly in your browser.

## Configuration

You can modify the following settings in `kmrl_api_server.py`:

- `BASE_MODEL_PATH`: Path to your base Llama model
- `ADAPTER_PATH`: Path to your LoRA adapter
- `MAX_FILE_SIZE`: Maximum PDF file size (default: 16MB)
- `MAX_TEXT_LENGTH`: Maximum text length for processing (default: 3000 chars)

## Error Handling

The API includes comprehensive error handling:
- Invalid file types (non-PDF)
- File size limits
- Model loading errors
- Analysis failures
- Empty content validation

## Development

### Testing

Run the test client to verify all endpoints:
```bash
python test_client.py
```

### Adding CORS Support

Uncomment the CORS middleware section in `kmrl_api_server.py` if you need cross-origin support for web applications.

### Custom Analysis Logic

Modify the `analyze_document_api()` function to customize the analysis prompt or post-processing logic.

## Troubleshooting

### Model Loading Issues
- Verify model files exist in the specified paths
- Check GPU availability with `torch.cuda.is_available()`
- Ensure sufficient VRAM for model loading

### Server Won't Start
- Check port 8000 isn't already in use
- Verify all dependencies are installed
- Review error messages in the console

### Analysis Errors
- Check the health endpoint: `curl http://localhost:8000/health`
- Ensure input text isn't empty
- Verify PDF files contain extractable text

## Files

- `kmrl_api_server.py` - Main FastAPI server
- `test_client.py` - Test client for API validation
- `requirements.txt` - Python dependencies
- `README.md` - This documentation

## License

This project is developed for Kochi Metro Rail Limited's document analysis needs.


