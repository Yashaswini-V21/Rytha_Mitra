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
        # Use ROOT as base
        path = path.lstrip('/')
        return os.path.join(ROOT, path)

print(f"=== RythaGelathi Dev Server ===")
print(f"  http://localhost:{PORT}/index.html")
print(f"  http://localhost:{PORT}/climate.html")
print(f"  http://localhost:{PORT}/core.html")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
