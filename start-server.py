import http.server
import socketserver
import os

PORT = 3000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"✅ Server läuft auf http://localhost:{PORT}")
    print(f"📂 Serving files from: {os.getcwd()}")
    print(f"\n🌐 Öffne im Browser: http://localhost:{PORT}")
    print(f"\nDrücke STRG+C zum Beenden\n")
    httpd.serve_forever()

