import http.server, os, socketserver

PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/public/'):
            self.path = self.path  # already correct relative to ROOT
        else:
            self.path = '/frontend' + self.path
        return super().do_GET()

    def translate_path(self, path):
        path = path.lstrip('/')
        return os.path.join(ROOT, path)

    def end_headers(self):
        # Prevent caching during development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

print(f"=== RythaGelathi Dev Server ===")
print(f"  http://localhost:{PORT}/index.html")
print(f"  http://localhost:{PORT}/climate.html")
print(f"  http://localhost:{PORT}/core.html")
print(f"  Cache-Control: no-cache (dev mode)")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
