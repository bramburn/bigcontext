"""
FastAPI Sidecar Service for Code Context Engine VSCode Extension

This service provides REST API endpoints for advanced functionality
that complements the main VSCode extension.
"""

import asyncio
import argparse
import logging
import os
import signal
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any, Optional, List

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
    "database_connections": {},
    "last_database_check": None,
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

class DatabaseConnectionConfig(BaseModel):
    connection_string: str
    connection_type: str = "qdrant"
    timeout_seconds: Optional[int] = 30

class DatabaseHealthResponse(BaseModel):
    connection_name: str
    is_healthy: bool
    response_time_ms: float
    last_check: datetime
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class DatabaseHealthSummary(BaseModel):
    overall_healthy: bool
    total_connections: int
    healthy_connections: int
    unhealthy_connections: int
    connections: List[DatabaseHealthResponse]
    last_check: datetime

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

# Database health check functions
async def check_qdrant_connection(connection_string: str, timeout: int = 30) -> DatabaseHealthResponse:
    """Check Qdrant database connection health"""
    start_time = time.time()
    connection_name = f"qdrant_{connection_string.split('/')[-1] if '/' in connection_string else 'default'}"

    try:
        # Import here to avoid dependency issues if qdrant client is not available
        try:
            from qdrant_client import QdrantClient
        except ImportError:
            return DatabaseHealthResponse(
                connection_name=connection_name,
                is_healthy=False,
                response_time_ms=0,
                last_check=datetime.now(),
                error_message="Qdrant client not available - install qdrant-client package"
            )

        # Parse connection string
        if connection_string.startswith('http'):
            # HTTP connection
            client = QdrantClient(url=connection_string, timeout=timeout)
        else:
            # Assume host:port format
            parts = connection_string.split(':')
            host = parts[0] if parts else 'localhost'
            port = int(parts[1]) if len(parts) > 1 else 6333
            client = QdrantClient(host=host, port=port, timeout=timeout)

        # Perform health check
        collections = await asyncio.wait_for(
            asyncio.to_thread(client.get_collections),
            timeout=timeout
        )

        response_time = (time.time() - start_time) * 1000

        return DatabaseHealthResponse(
            connection_name=connection_name,
            is_healthy=True,
            response_time_ms=response_time,
            last_check=datetime.now(),
            details={
                "collections_count": len(collections.collections) if collections.collections else 0,
                "connection_type": "qdrant",
                "connection_string": connection_string
            }
        )

    except asyncio.TimeoutError:
        response_time = (time.time() - start_time) * 1000
        return DatabaseHealthResponse(
            connection_name=connection_name,
            is_healthy=False,
            response_time_ms=response_time,
            last_check=datetime.now(),
            error_message=f"Connection timeout after {timeout} seconds"
        )
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        return DatabaseHealthResponse(
            connection_name=connection_name,
            is_healthy=False,
            response_time_ms=response_time,
            last_check=datetime.now(),
            error_message=str(e)
        )

async def check_database_health(config: DatabaseConnectionConfig) -> DatabaseHealthResponse:
    """Check database health based on connection type"""
    if config.connection_type.lower() == "qdrant":
        return await check_qdrant_connection(
            config.connection_string,
            config.timeout_seconds or 30
        )
    else:
        return DatabaseHealthResponse(
            connection_name=f"unknown_{config.connection_type}",
            is_healthy=False,
            response_time_ms=0,
            last_check=datetime.now(),
            error_message=f"Unsupported connection type: {config.connection_type}"
        )

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
            "request_tracking",
            "database_health_checks",
            "qdrant_connectivity"
        ],
        endpoints=[
            "/health",
            "/health/detailed",
            "/health/database",
            "/health/database/{connection_name}",
            "/database/register",
            "/database/unregister/{connection_name}",
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

# Database health check endpoints
@app.post("/database/register")
async def register_database_connection(config: DatabaseConnectionConfig):
    """Register a database connection for health monitoring"""
    try:
        # Test the connection first
        health_result = await check_database_health(config)

        # Store connection config
        connection_name = health_result.connection_name
        app_state["database_connections"][connection_name] = {
            "config": config.dict(),
            "last_health_check": health_result,
            "registered_at": datetime.now()
        }

        logger.info(f"Registered database connection: {connection_name}")

        return {
            "message": f"Database connection '{connection_name}' registered successfully",
            "connection_name": connection_name,
            "initial_health_check": health_result.dict()
        }

    except Exception as e:
        logger.error(f"Failed to register database connection: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/database/unregister/{connection_name}")
async def unregister_database_connection(connection_name: str):
    """Unregister a database connection"""
    if connection_name not in app_state["database_connections"]:
        raise HTTPException(status_code=404, detail=f"Connection '{connection_name}' not found")

    del app_state["database_connections"][connection_name]
    logger.info(f"Unregistered database connection: {connection_name}")

    return {"message": f"Database connection '{connection_name}' unregistered successfully"}

@app.get("/health/database", response_model=DatabaseHealthSummary)
async def check_all_database_health():
    """Check health of all registered database connections"""
    if not app_state["database_connections"]:
        return DatabaseHealthSummary(
            overall_healthy=True,
            total_connections=0,
            healthy_connections=0,
            unhealthy_connections=0,
            connections=[],
            last_check=datetime.now()
        )

    health_checks = []

    # Check each registered connection
    for connection_name, connection_data in app_state["database_connections"].items():
        try:
            config = DatabaseConnectionConfig(**connection_data["config"])
            health_result = await check_database_health(config)
            health_checks.append(health_result)

            # Update stored health check
            app_state["database_connections"][connection_name]["last_health_check"] = health_result

        except Exception as e:
            logger.error(f"Failed to check health for {connection_name}: {e}")
            health_checks.append(DatabaseHealthResponse(
                connection_name=connection_name,
                is_healthy=False,
                response_time_ms=0,
                last_check=datetime.now(),
                error_message=f"Health check failed: {str(e)}"
            ))

    healthy_count = sum(1 for check in health_checks if check.is_healthy)
    unhealthy_count = len(health_checks) - healthy_count

    app_state["last_database_check"] = datetime.now()

    return DatabaseHealthSummary(
        overall_healthy=unhealthy_count == 0,
        total_connections=len(health_checks),
        healthy_connections=healthy_count,
        unhealthy_connections=unhealthy_count,
        connections=health_checks,
        last_check=datetime.now()
    )

@app.get("/health/database/{connection_name}", response_model=DatabaseHealthResponse)
async def check_specific_database_health(connection_name: str):
    """Check health of a specific database connection"""
    if connection_name not in app_state["database_connections"]:
        raise HTTPException(status_code=404, detail=f"Connection '{connection_name}' not found")

    try:
        connection_data = app_state["database_connections"][connection_name]
        config = DatabaseConnectionConfig(**connection_data["config"])
        health_result = await check_database_health(config)

        # Update stored health check
        app_state["database_connections"][connection_name]["last_health_check"] = health_result

        return health_result

    except Exception as e:
        logger.error(f"Failed to check health for {connection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    parser = argparse.ArgumentParser(description="Code Context Engine Sidecar Service")
    parser.add_argument("--port", type=int, help="Preferred port to run the service on")
    parser.add_argument("--port-start", type=int, default=8000, help="Start of port range to search")
    parser.add_argument("--port-end", type=int, default=9000, help="End of port range to search")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--log-level", default="info", choices=["debug", "info", "warning", "error"])
    args = parser.parse_args()

    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))

    # Discover available port
    port_discovery = PortDiscovery(start_port=args.port_start, end_port=args.port_end)
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
