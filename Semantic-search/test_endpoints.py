# request.py
import requests

API_URL = "http://127.0.0.1:8000"

def test_home():
    try:
        resp = requests.get(f"{API_URL}/")
        print("Home:", resp.json())
        return True
    except Exception as e:
        print(f"Error testing home: {e}")
        return False

def upload_files():

    try:
        with open("pdfs/Annual-Return-2023-24.pdf", "rb") as f1, \
             open("pdfs/CDO_Kochi_Metro.pdf", "rb") as f2:
            
            files = [
                ('files', ('Annual-Return-2023-24.pdf', f1, "application/pdf")),
                ('files', ('CDO_Kochi_Metro.pdf', f2, "application/pdf")),
            ]
            
            print("Uploading files...")
            resp = requests.post(f"{API_URL}/upload/", files=files)
            
            # Check if response is valid JSON
            if resp.status_code == 200:
                try:
                    result = resp.json()
                    print("Upload Response:", result)
                    return True
                except requests.exceptions.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    print(f"Response status: {resp.status_code}")
                    print(f"Response text: {resp.text}")
                    return False
            else:
                print(f"Upload failed with status {resp.status_code}: {resp.text}")
                return False
                
    except FileNotFoundError as e:
        print(f"File not found: {e}")
        return False
    except Exception as e:
        print(f"Error uploading files: {e}")
        return False

def search_documents():
    try:
        query = "electronic and IT department"
        print(f"Searching for: '{query}'")
        resp = requests.get(f"{API_URL}/search/", params={"query": query})
        
        if resp.status_code == 200:
            result = resp.json()
            print("Search:", result)
            return True
        else:
            print(f"Search failed with status {resp.status_code}: {resp.text}")
            return False
            
    except Exception as e:
        print(f"Error searching: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Semantic Search API ===")
    
    if not test_home():
        print("Home endpoint failed, exiting...")
        exit(1)
    
    if upload_files():
        print("Files uploaded successfully!")
        search_documents()
    else:
        print("File upload failed, skipping search...")
