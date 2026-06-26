import asyncio
import logging
from sqlalchemy import create_engine, text
from app.config import get_settings
from app.dependencies import get_redis_client, get_qdrant_client
from app.tools.sql_tool import get_db_url
from app.observability.alerts import send_health_alert

logger = logging.getLogger("uvicorn.error")

# Track previous states to avoid spamming the channel
service_status = {
    "supabase": "ok",
    "redis": "ok",
    "qdrant": "ok"
}

async def check_services_health():
    settings = get_settings()
    print("[Health Monitor] Running service connectivity checks...", flush=True)

    # 1. Supabase check
    if settings.SUPABASE_URL and settings.SUPABASE_DB_PASSWORD:
        try:
            db_url = get_db_url()
            engine = create_engine(db_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            if service_status["supabase"] != "ok":
                logger.info("Supabase database recovered.")
                await send_health_alert("Supabase Database", "Service has recovered and is back online.", recovered=True)
                service_status["supabase"] = "ok"
        except Exception as e:
            if service_status["supabase"] == "ok":
                error_msg = f"Failed database connection check: {str(e)}"
                logger.error(error_msg)
                await send_health_alert("Supabase Database", error_msg)
                service_status["supabase"] = "error"

    # 2. Redis check
    if settings.UPSTASH_REDIS_URL:
        try:
            redis_client = get_redis_client(settings)
            redis_client.ping()
            if service_status["redis"] != "ok":
                logger.info("Redis cache recovered.")
                await send_health_alert("Redis Cache", "Service has recovered and is back online.", recovered=True)
                service_status["redis"] = "ok"
        except Exception as e:
            if service_status["redis"] == "ok":
                error_msg = f"Failed Redis ping check: {str(e)}"
                logger.error(error_msg)
                await send_health_alert("Redis Cache", error_msg)
                service_status["redis"] = "error"

    # 3. Qdrant check
    if settings.QDRANT_URL:
        try:
            qdrant_client = get_qdrant_client(settings)
            qdrant_client.get_collections()
            if service_status["qdrant"] != "ok":
                logger.info("Qdrant database recovered.")
                await send_health_alert("Qdrant Vector DB", "Service has recovered and is back online.", recovered=True)
                service_status["qdrant"] = "ok"
        except Exception as e:
            if service_status["qdrant"] == "ok":
                error_msg = f"Failed Qdrant collections check: {str(e)}"
                logger.error(error_msg)
                await send_health_alert("Qdrant Vector DB", error_msg)
                service_status["qdrant"] = "error"

async def periodic_health_monitor():
    print("[Health Monitor] Initializing background service health monitor task...", flush=True)
    # Give the server some time to fully spin up before running health checks
    await asyncio.sleep(15)
    while True:
        try:
            await check_services_health()
        except Exception as e:
            print(f"[Health Monitor] Uncaught exception in periodic health check loop: {e}", flush=True)
        # Run health checks every 60 seconds
        await asyncio.sleep(60)
