"""
FastAPI Sidecar Service for Code Context Engine VSCode Extension

This service provides REST API endpoints for advanced functionality
that complements the main VSCode extension.
"""

import asyncio
import logging
import os
import signal
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any, Optional

import psutil
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from port_discovery import PortDiscovery

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("sidecar.log", mode="a")
    ]
)

logger = logging.getLogger(__name__)

# Global state
app_state = {
    "start_time": datetime.now(),
    "port": None,
    "shutdown_requested": False,
    "request_count": 0,
    "error_count": 0,
}

# Pydantic models
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    uptime_seconds: float

class DetailedHealthResponse(BaseModel):
    status: str
    timestamp: datetime
    uptime_seconds: float
    port: Optional[int]
    process_info: Dict[str, Any]
    system_info: Dict[str, Any]
    request_count: int
    error_count: int

class ServiceInfo(BaseModel):
    name: str
    version: str
    description: str
    capabilities: list[str]
    endpoints: list[str]

class ShutdownRequest(BaseModel):
    reason: Optional[str] = "Manual shutdown"
    delay_seconds: Optional[int] = 0

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    logger.info("Starting Code Context Engine Sidecar Service")
    
    # Startup
    app_state["start_time"] = datetime.now()
    logger.info(f"Service started at {app_state['start_time']}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Code Context Engine Sidecar Service")

# Create FastAPI app
app = FastAPI(
    title="Code Context Engine Sidecar",
    description="FastAPI sidecar service for Code Context Engine VSCode extension",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to track requests
@app.middleware("http")
async def track_requests(request, call_next):
    """Track request count and errors"""
    app_state["request_count"] += 1
    
    try:
        response = await call_next(request)
        if response.status_code >= 400:
            app_state["error_count"] += 1
        return response
    except Exception as e:
        app_state["error_count"] += 1
        logger.error(f"Request error: {e}")
        raise

# Health check endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint"""
    uptime = (datetime.now() - app_state["start_time"]).total_seconds()
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        uptime_seconds=uptime
    )

@app.get("/health/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check():
    """Detailed health check with system information"""
    uptime = (datetime.now() - app_state["start_time"]).total_seconds()
    
    # Get process information
    process = psutil.Process()
    process_info = {
        "pid": process.pid,
        "memory_usage_mb": process.memory_info().rss / 1024 / 1024,
        "cpu_percent": process.cpu_percent(),
        "num_threads": process.num_threads(),
        "status": process.status()
    }
    
    # Get system information
    system_info = {
        "cpu_count": psutil.cpu_count(),
        "memory_total_gb": psutil.virtual_memory().total / 1024 / 1024 / 1024,
        "memory_available_gb": psutil.virtual_memory().available / 1024 / 1024 / 1024,
        "disk_usage_percent": psutil.disk_usage('/').percent,
        "platform": sys.platform
    }
    
    return DetailedHealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        uptime_seconds=uptime,
        port=app_state.get("port"),
        process_info=process_info,
        system_info=system_info,
        request_count=app_state["request_count"],
        error_count=app_state["error_count"]
    )

# Service information endpoint
@app.get("/info", response_model=ServiceInfo)
async def service_info():
    """Get service information and capabilities"""
    return ServiceInfo(
        name="Code Context Engine Sidecar",
        version="0.1.0",
        description="FastAPI sidecar service providing advanced functionality for the Code Context Engine VSCode extension",
        capabilities=[
            "health_monitoring",
            "dynamic_port_discovery",
            "graceful_shutdown",
            "system_metrics",
            "request_tracking"
        ],
        endpoints=[
            "/health",
            "/health/detailed", 
            "/info",
            "/shutdown",
            "/docs",
            "/redoc"
        ]
    )

# Shutdown endpoint
@app.post("/shutdown")
async def shutdown_service(
    shutdown_request: ShutdownRequest,
    background_tasks: BackgroundTasks
):
    """Gracefully shutdown the service"""
    logger.info(f"Shutdown requested: {shutdown_request.reason}")
    
    if shutdown_request.delay_seconds > 0:
        logger.info(f"Shutdown delayed by {shutdown_request.delay_seconds} seconds")
        background_tasks.add_task(delayed_shutdown, shutdown_request.delay_seconds)
    else:
        background_tasks.add_task(immediate_shutdown)
    
    return {"message": "Shutdown initiated", "delay_seconds": shutdown_request.delay_seconds}

async def delayed_shutdown(delay_seconds: int):
    """Shutdown after a delay"""
    await asyncio.sleep(delay_seconds)
    await immediate_shutdown()

async def immediate_shutdown():
    """Immediate shutdown"""
    app_state["shutdown_requested"] = True
    logger.info("Initiating immediate shutdown")
    os.kill(os.getpid(), signal.SIGTERM)

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    app_state["error_count"] += 1
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

def main():
    """Main entry point"""
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description="Code Context Engine Sidecar Service")
    parser.add_argument("--port", type=int, help="Port to run the service on")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--log-level", default="info", choices=["debug", "info", "warning", "error"])
    args = parser.parse_args()
    
    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))
    
    # Discover available port
    port_discovery = PortDiscovery()
    port = port_discovery.find_available_port(args.port)
    
    if not port:
        logger.error("No available ports found")
        sys.exit(1)
    
    app_state["port"] = port
    logger.info(f"Starting service on {args.host}:{port}")
    
    # Write port to file for extension to read
    with open("sidecar_port.txt", "w") as f:
        f.write(str(port))
    
    try:
        # Run the server
        uvicorn.run(
            app,
            host=args.host,
            port=port,
            log_level=args.log_level,
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("Service interrupted by user")
    except Exception as e:
        logger.error(f"Service error: {e}")
        sys.exit(1)
    finally:
        # Cleanup
        try:
            os.remove("sidecar_port.txt")
        except FileNotFoundError:
            pass

if __name__ == "__main__":
    main()
