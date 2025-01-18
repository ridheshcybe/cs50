from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs

class Router:
    def __init__(self):
        self._routes = {}
    
    def add_route(self, path, handler, method='GET'):
        """Register a new route with its handler function."""
        if path not in self._routes:
            self._routes[path] = {}
        self._routes[path][method.upper()] = handler
    
    def get_handler(self, path, method):
        """Retrieve the handler function for a given path and method."""
        return self._routes.get(path, {}).get(method.upper())
    
    def get_routes(self):
        """Return all registered routes."""
        return self._routes

class CustomRequestHandler(BaseHTTPRequestHandler):
    router = None
    
    def _send_response(self, status_code, content):
        """Send HTTP response with appropriate headers and content."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        if isinstance(content, dict):
            content = json.dumps(content)
        self.wfile.write(content.encode())
    
    def _handle_request(self, method):
        """Process incoming HTTP requests."""
        handler = self.router.get_handler(self.path, method)
        
        if handler is None:
            self._send_response(404, {"error": "Route not found"})
            return
        
        try:
            if method == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length).decode()
                result = handler(parse_qs(post_data))
            else:
                result = handler()
            
            self._send_response(200, result)
        except Exception as e:
            self._send_response(500, {"error": str(e)})
    
    def do_GET(self):
        """Handle GET requests."""
        self._handle_request('GET')
    
    def do_POST(self):
        """Handle POST requests."""
        self._handle_request('POST')
