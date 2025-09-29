


import imaplib
import email
import os
import time
import requests
from datetime import datetime, timedelta

class GmailAttachmentForwarder:
    def __init__(self, backend_api, download_dir="attachments"):
        self.backend_api = backend_api
        self.download_dir = download_dir
        self.last_check_time = datetime.now() - timedelta(minutes=5)
        self.processed_emails = set()
        os.makedirs(download_dir, exist_ok=True)

    def get_new_emails_with_attachments(self, email_address, password, imap_server="imap.gmail.com"):
        """Fetch emails with attachments since last check"""
        try:
            mail = imaplib.IMAP4_SSL(imap_server)
            mail.login(email_address, password)
            mail.select("inbox")

            search_date = (self.last_check_time - timedelta(minutes=2)).strftime("%d-%b-%Y")
            status, messages = mail.search(None, f'SINCE {search_date}')

            if status != "OK":
                return []

            email_ids = messages[0].split()
            emails_with_files = []

            for email_id in email_ids:
                email_id_str = email_id.decode()
                if email_id_str in self.processed_emails:
                    continue

                status, msg_data = mail.fetch(email_id, "(RFC822)")
                if status != "OK":
                    continue

                email_body = msg_data[0][1]
                email_message = email.message_from_bytes(email_body)

                for part in email_message.walk():
                    if part.get_content_disposition() == "attachment" and part.get_filename():
                        filename = part.get_filename()
                        filepath = os.path.join(self.download_dir, filename)

                        with open(filepath, "wb") as f:
                            f.write(part.get_payload(decode=True))

                        emails_with_files.append(filepath)

                self.processed_emails.add(email_id_str)

            mail.close()
            mail.logout()
            return emails_with_files

        except Exception as e:
            print(f"❌ Error fetching emails: {e}")
            return []

    def forward_to_backend(self, filepaths):
        """Send each file to backend API"""
        for filepath in filepaths:
            try:
                with open(filepath, "rb") as f:
                    files = {"file": f}
                    resp = requests.post(self.backend_api, files=files)

                if resp.status_code == 200:
                    print(f"✅ Sent {filepath} to backend")
                else:
                    print(f"⚠️ Failed to send {filepath}: {resp.status_code}")
            except Exception as e:
                print(f"❌ Error sending {filepath}: {e}")

    def start_monitoring(self, email_address, password, interval=30):
        """Loop to check inbox and forward files"""
        print("🚀 Gmail Attachment Forwarder Started")
        while True:
            new_files = self.get_new_emails_with_attachments(email_address, password)
            if new_files:
                print(f"📩 Found {len(new_files)} new attachments")
                self.forward_to_backend(new_files)
            else:
                print("📭 No new attachments")

            self.last_check_time = datetime.now()
            time.sleep(interval)


def main():
    EMAIL = "casecraftstudio20@gmail.com"
    APP_PASSWORD = "xkus onya bygn nokc"  # create from Google App Passwords
    BACKEND_API = "http://127.0.0.1:8001/upload"  # your backend

    forwarder = GmailAttachmentForwarder(backend_api=BACKEND_API)
    forwarder.start_monitoring(email_address=EMAIL, password=APP_PASSWORD, interval=30)


if __name__ == "__main__":
    main()

