from langchain_core.tools import tool
from langsmith import traceable

@tool
@traceable(name="analytics_tool")
def get_analytics(metric_type: str, time_range: str = "30d") -> str:
    """
    Get pre-computed system analytics for Managers and Admins.
    metric_type can be: 'top_queries', 'query_volume', 'user_engagement', 'system_health'
    """
    return f"Mock analytics for {metric_type} over {time_range}"
