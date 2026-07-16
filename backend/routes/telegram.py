import httpx
from fastapi import APIRouter, Request
from config import TELEGRAM_BOT_TOKEN

router = APIRouter(tags=["telegram"])

BASE_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


async def send_message(chat_id: int, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(f"{BASE_URL}/sendMessage", json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        })


def notify_user(telegram_id: int, order_id: int, text: str):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(send_message(telegram_id, text))
        else:
            loop.run_until_complete(send_message(telegram_id, text))
    except Exception:
        pass


def notify_cook(telegram_id: int, order_id: int, user_name: str):
    notify_user(telegram_id, order_id, f"🆕 Новый заказ #{order_id} от {user_name}!")


@router.post("/webhook")
async def webhook(request: Request):
    data = await request.json()
    message = data.get("message") or data.get("callback_query", {}).get("message")
    if not message:
        return {"ok": True}

    chat_id = message["chat"]["id"]
    text = message.get("text", "")

    if text == "/start":
        await send_message(chat_id, "👋 Добро пожаловать!\nОткройте меню заказа через кнопку внизу.")
    elif text == "/help":
        await send_message(chat_id, "ℹ️ Откройте Mini App для заказа еды.")

    return {"ok": True}
