"""FastAPI Application - Helios Intelligence API.

Main application entry point with CORS, middleware, and router configuration.
"""

from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from backend.core.config import settings
from backend.core.database import engine, init_db
from loguru import logger
import sys


# Configure loguru
logger.remove()
logger.add(
    sys.stdout,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level=settings.log_level,
)
logger.add(
    settings.log_file,
    rotation=settings.log_rotation,
    retention=settings.log_retention,
    format=settings.log_format if settings.log_format == "json" else "{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level=settings.log_level,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info(f"Starting {settings.app_name}...")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Database URL: {settings.database_url}")
    
    # Initialize database tables (development only)
    if settings.debug:
        logger.info("Initializing database tables...")
        init_db()
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    engine.dispose()
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Trustworthy AI Scientific Decision Support Platform for Space Weather",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# Configure CORS — always allow the live Amplify frontend + any from settings
ALWAYS_ALLOWED = [
    "https://main.d2yima0bkh6map.amplifyapp.com",  # AWS Amplify live
    "http://localhost:5173",                          # local Vite dev
    "http://localhost:3000",                          # local alt port
]
extra_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()] if settings.cors_origins else []
origins = list(set(ALWAYS_ALLOWED + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.debug else "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "description": "Trustworthy AI Scientific Decision Support Platform for Space Weather",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "operational",
    }


# Include routers
from backend.api.routers import events, predictions, fusion, recommendations, uncertainty, explanations, pipeline

app.include_router(events.router)
app.include_router(predictions.router)
app.include_router(fusion.router)
app.include_router(recommendations.router)
app.include_router(uncertainty.router)
app.include_router(explanations.router)
app.include_router(pipeline.router)


if __name__ == "__main__":
    uvicorn.run(
        "backend.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        workers=1 if settings.debug else settings.api_workers,
        log_level=settings.log_level.lower(),
    )
