"""
Port Discovery Utility for FastAPI Sidecar Service

This module provides utilities for finding available ports and handling
port conflicts for the FastAPI sidecar service.
"""

import socket
import logging
import random
from typing import Optional, List
import psutil

logger = logging.getLogger(__name__)

class PortDiscovery:
    """Utility class for discovering available ports"""
    
    def __init__(self, start_port: int = 8000, end_port: int = 9000):
        """
        Initialize port discovery with a range of ports to check
        
        Args:
            start_port: Starting port number (default: 8000)
            end_port: Ending port number (default: 9000)
        """
        self.start_port = start_port
        self.end_port = end_port
        
    def is_port_available(self, port: int, host: str = "127.0.0.1") -> bool:
        """
        Check if a port is available for binding
        
        Args:
            port: Port number to check
            host: Host address to check (default: 127.0.0.1)
            
        Returns:
            True if port is available, False otherwise
        """
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                result = sock.bind((host, port))
                return True
        except (socket.error, OSError) as e:
            logger.debug(f"Port {port} is not available: {e}")
            return False
    
    def find_available_port(self, preferred_port: Optional[int] = None) -> Optional[int]:
        """
        Find an available port within the configured range
        
        Args:
            preferred_port: Preferred port to try first (optional)
            
        Returns:
            Available port number or None if no ports available
        """
        # Try preferred port first if provided
        if preferred_port and self.is_port_available(preferred_port):
            logger.info(f"Using preferred port: {preferred_port}")
            return preferred_port
        
        # Try ports in random order to avoid conflicts
        ports = list(range(self.start_port, self.end_port + 1))
        random.shuffle(ports)
        
        for port in ports:
            if self.is_port_available(port):
                logger.info(f"Found available port: {port}")
                return port
        
        logger.error(f"No available ports found in range {self.start_port}-{self.end_port}")
        return None
    
    def get_process_using_port(self, port: int) -> Optional[dict]:
        """
        Get information about the process using a specific port
        
        Args:
            port: Port number to check
            
        Returns:
            Dictionary with process information or None if no process found
        """
        try:
            for conn in psutil.net_connections():
                if conn.laddr.port == port:
                    try:
                        process = psutil.Process(conn.pid)
                        return {
                            "pid": conn.pid,
                            "name": process.name(),
                            "cmdline": process.cmdline(),
                            "status": process.status()
                        }
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        return {"pid": conn.pid, "name": "Unknown", "cmdline": [], "status": "Unknown"}
        except Exception as e:
            logger.error(f"Error getting process info for port {port}: {e}")
        
        return None
    
    def find_ports_in_use(self) -> List[int]:
        """
        Find all ports currently in use within the configured range
        
        Returns:
            List of port numbers currently in use
        """
        ports_in_use = []
        
        try:
            for conn in psutil.net_connections():
                if self.start_port <= conn.laddr.port <= self.end_port:
                    ports_in_use.append(conn.laddr.port)
        except Exception as e:
            logger.error(f"Error finding ports in use: {e}")
        
        return sorted(list(set(ports_in_use)))
