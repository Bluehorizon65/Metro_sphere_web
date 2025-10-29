# SIH_Bravo-6-Web-
SIH 2025 WEB


## FrontEnd :-
```
cd Frontend
npm install
npm run dev
```

## Backend:-
```
cd Frontend
npm install
node index.js
```
> [!warning] Backend might crash coz there is no db so wait for me to upload schema

## AI :-
```
cd AI

pip install -r requirements.txt
```
Download Base model:-
```
from huggingface_hub import snapshot_download
repo_id = "NousResearch/Hermes-3-Llama-3.2-3B"
download_dir = "./llam3.2(3b)"
snapshot_download(repo_id, local_dir=download_dir)
```
run ai server :-
```
python kmrl_api_server.py
```

## Semantic Search :-

```
cd Semantic-search

pip install -r requirements.txt

 uvicorn merged_api:app --port 8001
```

## twilio gmail :-

```
cd twilio/twilio_gmail

python backend.py
```

## twilio whatsapp :-

```
cd twilio/twilio_whtspp

uvicorn backend:app --port 8003 --reload
```
pipeline :-

```
cd pipeline

uvicorn full_pipeline:app --port 8002 --reload
```
