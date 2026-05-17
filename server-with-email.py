#!/usr/bin/env python3
"""
MASESites Contact Form Server mit Email-Versand
Läuft auf Port 8000
"""

import http.server
import socketserver
import json
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from urllib.parse import parse_qs
import mimetypes

PORT = 8000

class ContactFormHandler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):
        """Handle POST requests (Contact Form)"""
        if self.path == '/api/contact':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                # Parse JSON data
                data = json.loads(post_data.decode('utf-8'))

                # Validate required fields
                if not all([data.get('name'), data.get('email'), data.get('message'), data.get('privacy')]):
                    self.send_json_response(400, {
                        'success': False,
                        'message': 'Bitte fülle alle Pflichtfelder aus.'
                    })
                    return

                # Send emails
                success = self.send_contact_emails(data)

                if success:
                    self.send_json_response(200, {
                        'success': True,
                        'message': 'Nachricht erfolgreich gesendet! Wir melden uns in 24-48h.'
                    })
                else:
                    self.send_json_response(500, {
                        'success': False,
                        'message': 'Email-Versand fehlgeschlagen. Bitte schreibe direkt an info@masesites.ch'
                    })

            except json.JSONDecodeError:
                self.send_json_response(400, {
                    'success': False,
                    'message': 'Ungültige Daten'
                })
            except Exception as e:
                print(f"❌ Error: {e}")
                self.send_json_response(500, {
                    'success': False,
                    'message': 'Ein Fehler ist aufgetreten. Bitte schreibe direkt an info@masesites.ch'
                })
        else:
            self.send_error(404)

    def send_contact_emails(self, data):
        """Send contact form emails"""
        try:
            # Email to MASESites
            company_email = self.create_company_email(data)
            user_email = self.create_user_confirmation_email(data)

            # Check if SMTP credentials are configured
            smtp_server = os.getenv('SMTP_HOST', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            smtp_user = os.getenv('EMAIL_USER', '')
            smtp_pass = os.getenv('EMAIL_PASSWORD', '')

            if not smtp_user or not smtp_pass:
                print("⚠️  Keine Email-Konfiguration!")
                print("📧 Nachricht würde gesendet an: info@masesites.ch")
                print(f"📧 Von: {data['name']} ({data['email']})")
                print(f"📧 Nachricht: {data['message'][:100]}...")
                # Return True für Demo-Zwecke
                return True

            # Send via SMTP
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)

                # Send to company
                server.send_message(company_email)
                print(f"✅ Email an MASESites gesendet")

                # Send confirmation to user
                server.send_message(user_email)
                print(f"✅ Bestätigungs-Email an {data['email']} gesendet")

            return True

        except Exception as e:
            print(f"❌ Email Error: {e}")
            return False

    def create_company_email(self, data):
        """Create email to MASESites"""
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Neue Kontaktanfrage von {data['name']} - MASESites"
        msg['From'] = os.getenv('EMAIL_USER', 'noreply@masesites.ch')
        msg['To'] = 'info@masesites.ch'
        msg['Reply-To'] = data['email']

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6aa9ff; border-bottom: 2px solid #6aa9ff; padding-bottom: 10px;">
            Neue Kontaktanfrage
          </h2>

          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 10px 0;">{data['name']}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">E-Mail:</td>
              <td style="padding: 10px 0;"><a href="mailto:{data['email']}">{data['email']}</a></td>
            </tr>
            {f'''<tr>
              <td style="padding: 10px 0; font-weight: bold;">Firma:</td>
              <td style="padding: 10px 0;">{data.get('company', '')}</td>
            </tr>''' if data.get('company') else ''}
            {f'''<tr>
              <td style="padding: 10px 0; font-weight: bold;">Projektart:</td>
              <td style="padding: 10px 0;">{data.get('projectType', '')}</td>
            </tr>''' if data.get('projectType') else ''}
          </table>

          <div style="background: #f6f9ff; padding: 20px; border-left: 4px solid #6aa9ff; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Nachricht:</p>
            <p style="margin: 0; color: #334155; white-space: pre-line;">{data['message']}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <p style="font-size: 12px; color: #94a3b8;">
            Gesendet über MASESites Kontaktformular<br>
            {datetime.now().strftime('%d.%m.%Y %H:%M')}
          </p>
        </div>
        """

        msg.attach(MIMEText(html, 'html', 'utf-8'))
        return msg

    def create_user_confirmation_email(self, data):
        """Create confirmation email to user"""
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Deine Anfrage bei MASESites AG'
        msg['From'] = os.getenv('EMAIL_USER', 'noreply@masesites.ch')
        msg['To'] = data['email']

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6aa9ff;">Vielen Dank für deine Anfrage!</h2>

          <p>Hallo {data['name']},</p>

          <p>wir haben deine Nachricht erhalten und melden uns innerhalb von <strong>24-48 Stunden</strong> bei dir.</p>

          <div style="background: #f6f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #334155;">Deine Nachricht:</p>
            <p style="margin: 0; color: #64748b; white-space: pre-line;">{data['message']}</p>
          </div>

          <p style="color: #64748b;">
            Falls du noch Fragen hast, erreichst du uns jederzeit:
          </p>

          <div style="background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;">📧 <a href="mailto:info@masesites.ch" style="color: #6aa9ff;">info@masesites.ch</a></p>
            <p style="margin: 5px 0;">📱 <a href="tel:+41782158922" style="color: #6aa9ff;">078 215 89 22</a></p>
            <p style="margin: 5px 0;">🌐 <a href="https://www.masesites.ch" style="color: #6aa9ff;">www.masesites.ch</a></p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <p style="color: #64748b;">
            Mit freundlichen Grüssen,<br>
            <strong style="color: #334155;">Matteo & Severin</strong><br>
            MASESites AG
          </p>
        </div>
        """

        msg.attach(MIMEText(html, 'html', 'utf-8'))
        return msg

    def send_json_response(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle OPTIONS requests (CORS preflight)"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        """Add CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


if __name__ == '__main__':
    try:
        with socketserver.TCPServer(("", PORT), ContactFormHandler) as httpd:
            print(f"\n✅ MASESites Server läuft auf http://localhost:{PORT}")
            print(f"📧 Email-Empfänger: info@masesites.ch")
            print(f"📖 Setup: Siehe EMAIL-SETUP.md")
            print(f"⚠️  Aktuell OHNE Email (Test-Modus)")
            print(f"   Erstelle .env Datei für Email-Versand\n")
            print("Drücke CTRL+C zum Beenden\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server gestoppt")
    except OSError as e:
        if e.errno == 10048:
            print(f"\n❌ Port {PORT} ist bereits belegt!")
            print(f"   Beende andere Server oder ändere PORT in der Datei\n")
        else:
            raise

