"""
Tests for main FastAPI application
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime

from main import app, app_state


class TestFastAPIApp:
    """Test cases for FastAPI application"""
    
    def setup_method(self):
        """Setup test client and reset app state"""
        self.client = TestClient(app)
        # Reset app state for each test
        app_state.update({
            "start_time": datetime.now(),
            "port": None,
            "shutdown_requested": False,
            "request_count": 0,
            "error_count": 0,
        })
    
    def test_health_check_endpoint(self):
        """Test basic health check endpoint"""
        response = self.client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))
    
    @patch('psutil.Process')
    @patch('psutil.cpu_count')
    @patch('psutil.virtual_memory')
    @patch('psutil.disk_usage')
    def test_detailed_health_check_endpoint(self, mock_disk_usage, mock_virtual_memory, 
                                          mock_cpu_count, mock_process_class):
        """Test detailed health check endpoint"""
        # Mock system information
        mock_cpu_count.return_value = 8
        
        mock_memory = MagicMock()
        mock_memory.total = 16 * 1024 * 1024 * 1024  # 16GB
        mock_memory.available = 8 * 1024 * 1024 * 1024  # 8GB
        mock_virtual_memory.return_value = mock_memory
        
        mock_disk = MagicMock()
        mock_disk.percent = 75.0
        mock_disk_usage.return_value = mock_disk
        
        # Mock process information
        mock_process = MagicMock()
        mock_memory_info = MagicMock()
        mock_memory_info.rss = 100 * 1024 * 1024  # 100MB
        mock_process.memory_info.return_value = mock_memory_info
        mock_process.cpu_percent.return_value = 5.5
        mock_process.num_threads.return_value = 4
        mock_process.status.return_value = "running"
        mock_process.pid = 1234
        mock_process_class.return_value = mock_process
        
        response = self.client.get("/health/detailed")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "uptime_seconds" in data
        assert "process_info" in data
        assert "system_info" in data
        
        # Check process info
        process_info = data["process_info"]
        assert process_info["pid"] == 1234
        assert process_info["memory_usage_mb"] == 100.0
        assert process_info["cpu_percent"] == 5.5
        assert process_info["num_threads"] == 4
        assert process_info["status"] == "running"
        
        # Check system info
        system_info = data["system_info"]
        assert system_info["cpu_count"] == 8
        assert system_info["memory_total_gb"] == 16.0
        assert system_info["memory_available_gb"] == 8.0
        assert system_info["disk_usage_percent"] == 75.0
    
    def test_service_info_endpoint(self):
        """Test service information endpoint"""
        response = self.client.get("/info")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Code Context Engine Sidecar"
        assert data["version"] == "0.1.0"
        assert "description" in data
        assert isinstance(data["capabilities"], list)
        assert isinstance(data["endpoints"], list)
        
        # Check that expected capabilities are present
        expected_capabilities = [
            "health_monitoring",
            "dynamic_port_discovery", 
            "graceful_shutdown",
            "system_metrics",
            "request_tracking"
        ]
        for capability in expected_capabilities:
            assert capability in data["capabilities"]
        
        # Check that expected endpoints are present
        expected_endpoints = ["/health", "/health/detailed", "/info", "/shutdown"]
        for endpoint in expected_endpoints:
            assert endpoint in data["endpoints"]
    
    def test_request_tracking_middleware(self):
        """Test that request tracking middleware works"""
        initial_count = app_state["request_count"]
        
        # Make a request
        response = self.client.get("/health")
        assert response.status_code == 200
        
        # Check that request count increased
        assert app_state["request_count"] == initial_count + 1
    
    def test_error_tracking_middleware(self):
        """Test that error tracking middleware works"""
        initial_error_count = app_state["error_count"]
        
        # Make a request to non-existent endpoint
        response = self.client.get("/nonexistent")
        assert response.status_code == 404
        
        # Check that error count increased
        assert app_state["error_count"] == initial_error_count + 1
    
    @patch('main.immediate_shutdown')
    def test_shutdown_endpoint_immediate(self, mock_shutdown):
        """Test shutdown endpoint with immediate shutdown"""
        response = self.client.post("/shutdown", json={
            "reason": "Test shutdown",
            "delay_seconds": 0
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Shutdown initiated"
        assert data["delay_seconds"] == 0
    
    @patch('main.delayed_shutdown')
    def test_shutdown_endpoint_delayed(self, mock_delayed_shutdown):
        """Test shutdown endpoint with delayed shutdown"""
        response = self.client.post("/shutdown", json={
            "reason": "Test shutdown",
            "delay_seconds": 5
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Shutdown initiated"
        assert data["delay_seconds"] == 5
    
    def test_cors_headers(self):
        """Test that CORS headers are present"""
        response = self.client.get("/health")
        
        assert response.status_code == 200
        # CORS headers should be present (added by middleware)
        assert "access-control-allow-origin" in response.headers
    
    def test_openapi_docs_available(self):
        """Test that OpenAPI documentation is available"""
        response = self.client.get("/docs")
        assert response.status_code == 200
        
        response = self.client.get("/redoc")
        assert response.status_code == 200
        
        response = self.client.get("/openapi.json")
        assert response.status_code == 200
