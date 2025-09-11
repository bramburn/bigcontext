"""
Tests for port discovery functionality
"""

import pytest
import socket
from unittest.mock import patch, MagicMock

from port_discovery import PortDiscovery


class TestPortDiscovery:
    """Test cases for PortDiscovery class"""
    
    def test_init_default_values(self):
        """Test PortDiscovery initialization with default values"""
        pd = PortDiscovery()
        assert pd.start_port == 8000
        assert pd.end_port == 9000
    
    def test_init_custom_values(self):
        """Test PortDiscovery initialization with custom values"""
        pd = PortDiscovery(start_port=3000, end_port=4000)
        assert pd.start_port == 3000
        assert pd.end_port == 4000
    
    def test_is_port_available_success(self):
        """Test is_port_available when port is available"""
        pd = PortDiscovery()
        
        with patch('socket.socket') as mock_socket:
            mock_sock = MagicMock()
            mock_socket.return_value.__enter__.return_value = mock_sock
            mock_sock.bind.return_value = None
            
            result = pd.is_port_available(8080)
            assert result is True
            mock_sock.bind.assert_called_once_with(("127.0.0.1", 8080))
    
    def test_is_port_available_failure(self):
        """Test is_port_available when port is not available"""
        pd = PortDiscovery()
        
        with patch('socket.socket') as mock_socket:
            mock_sock = MagicMock()
            mock_socket.return_value.__enter__.return_value = mock_sock
            mock_sock.bind.side_effect = socket.error("Port in use")
            
            result = pd.is_port_available(8080)
            assert result is False
    
    def test_find_available_port_preferred_available(self):
        """Test find_available_port when preferred port is available"""
        pd = PortDiscovery()
        
        with patch.object(pd, 'is_port_available') as mock_is_available:
            mock_is_available.return_value = True
            
            result = pd.find_available_port(preferred_port=8080)
            assert result == 8080
            mock_is_available.assert_called_once_with(8080)
    
    def test_find_available_port_preferred_not_available(self):
        """Test find_available_port when preferred port is not available"""
        pd = PortDiscovery(start_port=8000, end_port=8002)
        
        with patch.object(pd, 'is_port_available') as mock_is_available:
            # Preferred port not available, but 8001 is available
            mock_is_available.side_effect = lambda port: port == 8001
            
            result = pd.find_available_port(preferred_port=8080)
            assert result == 8001
    
    def test_find_available_port_no_ports_available(self):
        """Test find_available_port when no ports are available"""
        pd = PortDiscovery(start_port=8000, end_port=8002)
        
        with patch.object(pd, 'is_port_available') as mock_is_available:
            mock_is_available.return_value = False
            
            result = pd.find_available_port()
            assert result is None
    
    @patch('psutil.net_connections')
    def test_get_process_using_port_found(self, mock_net_connections):
        """Test get_process_using_port when process is found"""
        pd = PortDiscovery()
        
        # Mock connection object
        mock_conn = MagicMock()
        mock_conn.laddr.port = 8080
        mock_conn.pid = 1234
        mock_net_connections.return_value = [mock_conn]
        
        # Mock process
        with patch('psutil.Process') as mock_process_class:
            mock_process = MagicMock()
            mock_process.name.return_value = "test_process"
            mock_process.cmdline.return_value = ["python", "test.py"]
            mock_process.status.return_value = "running"
            mock_process_class.return_value = mock_process
            
            result = pd.get_process_using_port(8080)
            
            assert result is not None
            assert result["pid"] == 1234
            assert result["name"] == "test_process"
            assert result["cmdline"] == ["python", "test.py"]
            assert result["status"] == "running"
    
    @patch('psutil.net_connections')
    def test_get_process_using_port_not_found(self, mock_net_connections):
        """Test get_process_using_port when no process is found"""
        pd = PortDiscovery()
        
        # Mock connection with different port
        mock_conn = MagicMock()
        mock_conn.laddr.port = 9090
        mock_net_connections.return_value = [mock_conn]
        
        result = pd.get_process_using_port(8080)
        assert result is None
    
    @patch('psutil.net_connections')
    def test_find_ports_in_use(self, mock_net_connections):
        """Test find_ports_in_use functionality"""
        pd = PortDiscovery(start_port=8000, end_port=8010)
        
        # Mock connections
        mock_conns = []
        for port in [8001, 8005, 8009, 9000]:  # 9000 is outside range
            mock_conn = MagicMock()
            mock_conn.laddr.port = port
            mock_conns.append(mock_conn)
        
        mock_net_connections.return_value = mock_conns
        
        result = pd.find_ports_in_use()
        
        # Should only include ports within range
        assert result == [8001, 8005, 8009]
        assert 9000 not in result
