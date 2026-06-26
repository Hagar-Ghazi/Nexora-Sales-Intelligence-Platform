import httpx
import logging
from app.config import get_settings

logger = logging.getLogger("uvicorn.error")

async def send_slack_message(payload: dict) -> bool:
    settings = get_settings()
    webhook_url = settings.SLACK_WEBHOOK_URL
    if not webhook_url:
        logger.info("Slack webhook URL not configured. Skipping alert.")
        return False
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=payload)
            if response.status_code == 200:
                return True
            else:
                logger.error(f"Failed to send Slack alert: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logger.error(f"Error sending Slack alert: {e}")
        return False

async def send_security_alert(user_id: str, role: str, query: str, block_reason: str) -> bool:
    payload = {
        "text": "🚨 Security Alert: Blocked SQL Injection or Malicious Query",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 Security Alert: Blocked Query"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*User ID:*\n`{user_id}`"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Role:*\n`{role}`"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Blocked Query:*\n```{query}```"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Reason:*\n{block_reason}"
                }
            }
        ]
    }
    return await send_slack_message(payload)

async def send_health_alert(service_name: str, error_message: str, recovered: bool = False) -> bool:
    emoji = "✅" if recovered else "🚨"
    title = f"{emoji} Service Health Alert: {service_name}"
    status_text = "*ONLINE (Recovered)*" if recovered else "*OFFLINE (Downtime Detected)*"
    color = "#2eb886" if recovered else "#a30200"
    
    payload = {
        "text": title,
        "attachments": [
            {
                "color": color,
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": title
                        }
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": f"*Service:*\n{service_name}"
                            },
                            {
                                "type": "mrkdwn",
                                "text": f"*Status:*\n{status_text}"
                            }
                        ]
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Details:*\n{error_message}"
                        }
                    }
                ]
            }
        ]
    }
    return await send_slack_message(payload)
