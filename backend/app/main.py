import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.services.schema_service import schema_service
from app.core.logging import logger
from app.core.config import settings
from app.core.request_context import set_request_llm_api_key, reset_request_llm_api_key
import os
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    try:
        from app.etl.scheduler import etl_scheduler
        etl_scheduler.start()
        
        # Schema refresh is now event-driven (post-sync)
        # logger.info("Refreshing Semantic Model (MDL)...")
        # schema_service.refresh_mdl()
    except Exception as e:
        logger.error(f"Failed to start components: {e}")
        
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    try:
        from app.etl.scheduler import etl_scheduler
        etl_scheduler.shutdown()
    except Exception as e:
        logger.error(f"Failed to shutdown ETL scheduler: {e}")

logger.info("Initializing Kuantra API")
app = FastAPI(title="Kuantra AI Backend", lifespan=lifespan)

def _build_cors_origins() -> list[str]:
    origins = {
        "http://localhost:5173",
        "http://localhost:3000",
        "https://localhost:5173",
        "https://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:5173",
        "https://127.0.0.1:3000",
    }
    configured = (settings.CORS_ORIGINS or "").strip()
    if configured:
        for origin in configured.split(","):
            origin = origin.strip().rstrip("/")
            if origin:
                origins.add(origin)
    vercel_url = os.environ.get("VERCEL_URL")
    if vercel_url:
        origins.add(f"https://{vercel_url}")
    return sorted(origins)


# CORS setup
cors_origins = _build_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=settings.CORS_ALLOW_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    token = set_request_llm_api_key(request.headers.get("X-Google-Api-Key"))
    try:
        return await call_next(request)
    finally:
        reset_request_llm_api_key(token)

# Register endpoints
app.include_router(api_router, prefix="/api/v1")

# Schema refresh is now automatic via SchemaService
# @app.post("/api/v1/schemas/refresh/{connection_id}") removed

@app.get("/health")
async def health():
    """Overall health check endpoint."""
    try:
        # Simple redis check if needed, or remove if not using redis anymore
        redis_ok = True 
    except Exception:
        redis_ok = False
    
    # Check DuckDB health
    duckdb_status = {"status": "unknown"}
    try:
        from app.services.duckdb_manager import duckdb_manager
        duckdb_status = duckdb_manager.health_check()
    except Exception as e:
        duckdb_status = {"status": "unhealthy", "error": str(e)}
    
    overall_status = "healthy"
    if duckdb_status.get("status") != "healthy":
        overall_status = "degraded"
    if not redis_ok:
        overall_status = "degraded"
        
    return {
        "status": overall_status,
        "redis_available": redis_ok,
        "duckdb": duckdb_status,
        "message": "All systems operational" if overall_status == "healthy" else "Some services degraded"
    }

@app.get("/health/duckdb")
async def health_duckdb():
    """DuckDB-specific health check."""
    try:
        from app.services.duckdb_manager import duckdb_manager
        return duckdb_manager.health_check()
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/health/etl")
async def health_etl():
    """ETL service health check."""
    try:
        from app.etl.sync_service import sync_service
        
        running_syncs = len(sync_service._running_syncs)
        
        return {
            "status": "healthy",
            "running_syncs": running_syncs,
            "max_concurrent_syncs": 3,
            "active_jobs": list(sync_service._running_syncs.keys())
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
