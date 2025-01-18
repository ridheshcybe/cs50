import unittest
import requests
import threading
import time
from project import create_server

class TestWebServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Start the server in a separate thread for testing."""
        cls.server = create_server(port=8001)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        time.sleep(0.1)  # Allow server to start
    
    @classmethod
    def tearDownClass(cls):
        """Shut down the server after testing."""
        cls.server.shutdown()
        cls.server.server_close()
        cls.server_thread.join()
    
    def test_root_route(self):
        """Test the root route returns welcome message."""
        response = requests.get('http://localhost:8001/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Welcome to the server!"})
    
    def test_greet_route(self):
        """Test the greet route returns hello message."""
        response = requests.get('http://localhost:8001/greet')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Hello, World!"})
    
    def test_echo_route(self):
        """Test the echo route with POST data."""
        data = {"test": "data"}
        response = requests.post('http://localhost:8001/echo', data=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("received", response.json())
    
    def test_not_found(self):
        """Test handling of non-existent routes."""
        response = requests.get('http://localhost:8001/nonexistent')
        self.assertEqual(response.status_code, 404)
        self.assertIn("error", response.json())

if __name__ == '__main__':
    unittest.main()