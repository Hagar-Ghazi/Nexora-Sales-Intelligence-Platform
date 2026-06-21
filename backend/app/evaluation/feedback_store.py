def store_feedback(message_id: str, user_id: str, score: float, correction: str):
    """
    Stores user feedback in the database and also creates a LangSmith annotation
    for the specific trace.
    """
    # Mock implementation
    pass

def get_feedback_stats(days: int = 7) -> dict:
    """
    Returns aggregated feedback statistics for the admin dashboard.
    """
    # Mock implementation
    return {
        "thumbs_up": 150,
        "thumbs_down": 12,
        "average_score": 0.92
    }
