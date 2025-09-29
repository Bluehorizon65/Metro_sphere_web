import requests

def test_search():
    # Test with a random query that should not match well
    response = requests.get("http://localhost:8001/search/?query=abel is cute")
    print("=== Search Results ===")
    print(response.json())
    
    # Test with RAIL LIMITED
    response2 = requests.get("http://localhost:8001/search/?query=RAIL LIMITED")
    print("\n=== RAIL LIMITED Search ===")
    print(response2.json())
    
    response3 = requests.get("http://localhost:8001/search/?query=Metro")
    print("\n=== Metro Search ===")
    print(response3.json())
    
    response4 = requests.get("http://localhost:8001/search/?query=operations departement")
    print("\n=== operations departement Search ===")
    print(response4.json())
    
    response5 = requests.get("http://localhost:8001/search/?query=Aarin is baddie")
    print("\n=== Aarin is baddie Search ===")
    print(response5.json())
    
    response6 = requests.get("http://localhost:8001/search/?query=lauda lassan")
    print("\n=== lauda lassan Search ===")
    print(response6.json())

if __name__ == "__main__":
    test_search()