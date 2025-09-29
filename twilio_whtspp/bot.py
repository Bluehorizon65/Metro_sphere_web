from flask import Flask, request, Response
import requests
from twilio.twiml.messaging_response import MessagingResponse

app = Flask(__name__)

BACKEND_API = "http://127.0.0.1:8001/upload"

@app.route("/whatsapp", methods=["POST"])
def whatsapp_reply():
    try:
        resp = MessagingResponse()
        msg = resp.message()

        num_media = int(request.form.get("NumMedia", "0"))

        if num_media > 0:
            media_url = request.form.get("MediaUrl0")
            media_type = request.form.get("MediaContentType0")

            # Debugging logs
            print("📎 Received media:", media_url, media_type)

            # Forward to backend
            data = {"media_url": media_url, "media_type": media_type}
            backend_resp = requests.post(BACKEND_API, json=data)

            if backend_resp.status_code == 200:
                msg.body("📄 Thanks! Your document has been received and sent to our backend.")
            else:
                msg.body("⚠️ Error sending document to backend. Status: " + str(backend_resp.status_code))
        else:
            msg.body("Please send me a document 📑")

        return Response(str(resp), mimetype="application/xml")

    except Exception as e:
        print("❌ ERROR:", str(e))
        return Response("Error: " + str(e), status=500)

if __name__ == "__main__":
    app.run(debug=True)
