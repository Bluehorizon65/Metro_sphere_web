# semantic_search_app.py
import streamlit as st
import os
import tempfile
import numpy as np
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader

# ------------------ MODEL LOAD ------------------
@st.cache_resource
def load_model():
    return SentenceTransformer("all-MiniLM-L6-v2")

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

# ------------------ INGESTION ------------------
def ingest_pdfs(files):
    global pdf_embeddings, file_names
    for file in files:
        text = extract_text_from_pdf(file)
        if not text:
            continue

        # Create one embedding per PDF (global representation)
        emb = model.encode([text], convert_to_numpy=True).astype("float32")
        pdf_embeddings[file.name] = emb
        if file.name not in file_names:
            file_names.append(file.name)

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

        # scale from -1..1 → 0..100
        match_percent = round(((sim_score + 1) / 2) * 100, 2)

        results.append({"file": fname, "match": match_percent})

    # Sort all PDFs by similarity (descending)
    results = sorted(results, key=lambda x: x["match"], reverse=True)
    return results

# ------------------ STREAMLIT UI ------------------
st.title("📑 Semantic PDF Search")
st.write("Upload multiple PDFs and find which document best matches your query.")

uploaded_files = st.file_uploader("📂 Upload PDFs", type="pdf", accept_multiple_files=True)
if uploaded_files:
    ingest_pdfs(uploaded_files)
    st.success(f"✅ {len(uploaded_files)} file(s) ingested!")

query = st.text_input("🔍 Enter your search query")
flag =0
if st.button("Search"):
    if query.strip() == "":
        st.warning("Please enter a query!")
    else:
        results = search(query)
        st.subheader("📊 Document Ranking")
        if results:
            for r in results:
                if(r['match'] > 60):
                    flag=1
                    st.markdown(f"**{r['file']}** — 🟢 Match: {r['match']}%")
                    
            if(flag==0):
                st.error("No relevant documents found. Please try a different query.")
        else:
            st.error("No results found. Try uploading PDFs first.")
    