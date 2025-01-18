from http.server import HTTPServer
from socket import create_server
from routes import CustomRequestHandler, Router


def main(host='localhost', port=8000):
    """Create and configure the HTTP server."""
    router = Router()
    
    # Register example routes
    router.add_route('/', lambda: {"message": "Welcome to the server!"})
    router.add_route('/greet', lambda: {"message": "Hello, World!"})
    router.add_route('/echo', lambda data: {"received": data}, method='POST')
    
    # Configure request handler with router
    CustomRequestHandler.router = router
    
    # Create and return server instance
    return HTTPServer((host, port), CustomRequestHandler)

if __name__ == '__main__':
    server = create_server()
    print(f"Server running on http://localhost:8000")
    server.serve_forever()