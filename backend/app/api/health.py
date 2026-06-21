from fastapi import APIRouter
from app.dependencies import get_redis_client, get_supabase_client, get_qdrant_client
from fastapi import Depends

router = APIRouter(tags=["health"])

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/health/detailed")
def detailed_health_check(
    # redis = Depends(get_redis_client),
    # supabase = Depends(get_supabase_client),
    # qdrant = Depends(get_qdrant_client)
):
    """
    Checks connection to all backing services.
    Mocks for now.
    """
    return {
        "status": "ok",
        "services": {
            "redis": "ok",
            "supabase": "ok",
            "qdrant": "ok"
        }
    }

@router.get("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    return {"message": "Metrics will be exposed here"}
