import requests

# PDF analysis
with open('C:\\Users\\Enemb\\OneDrive\\Documents\\SIH_Bravo-6-Web-\\NIT-PMC.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/analyze/pdf',
        files={'file': f}
    )
    result = response.json()
    print(result)