from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Order, User, OrderLog, MenuItem
from schemas import OrderCreate, OrderOut, StatusUpdate, CancelItem, CancelOrder, StatsOut
from typing import List
from datetime import datetime, timedelta
from .telegram import notify_user, notify_cook

router = APIRouter(prefix="/api/orders", tags=["orders"])


def get_user(telegram_id: int, db: Session):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id, name="User", role="client")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.post("/", response_model=OrderOut)
def create_order(order: OrderCreate, telegram_id: int, db: Session = Depends(get_db)):
    user = get_user(telegram_id, db)
    total = sum(item.price * item.qty for item in order.items)
    items_data = [item.model_dump() for item in order.items]
    db_order = Order(user_id=user.id, items=items_data, total_price=total)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    log = OrderLog(order_id=db_order.id, action="created", created_by=user.id)
    db.add(log)
    db.commit()

    cooks = db.query(User).filter(User.role.in_(["cook", "admin"])).all()
    for cook in cooks:
        notify_cook(cook.telegram_id, db_order.id, user.name)

    return OrderOut(
        id=db_order.id, user_id=db_order.user_id, items=db_order.items,
        status=db_order.status, total_price=db_order.total_price,
        created_at=db_order.created_at, user_name=user.name
    )


@router.get("/my", response_model=List[OrderOut])
def my_orders(telegram_id: int, db: Session = Depends(get_db)):
    user = get_user(telegram_id, db)
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(50).all()
    return [OrderOut(
        id=o.id, user_id=o.user_id, items=o.items, status=o.status,
        total_price=o.total_price, created_at=o.created_at, user_name=user.name
    ) for o in orders]


@router.get("/active", response_model=List[OrderOut])
def active_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.status.notin_(["ready", "cancelled"])).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        user = db.query(User).filter(User.id == o.user_id).first()
        result.append(OrderOut(
            id=o.id, user_id=o.user_id, items=o.items, status=o.status,
            total_price=o.total_price, created_at=o.created_at,
            user_name=user.name if user else ""
        ))
    return result


@router.put("/{order_id}/status", response_model=OrderOut)
def update_status(order_id: int, data: StatusUpdate, telegram_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    log = OrderLog(order_id=order.id, action=f"status:{data.status}", created_by=None)
    db.add(log)
    db.commit()
    db.refresh(order)

    user = db.query(User).filter(User.id == order.user_id).first()
    if user:
        status_text = {"accepted": "принят", "cooking": "готовится", "ready": "готов", "cancelled": "отменён"}
        notify_user(user.telegram_id, order.id, f"Ваш заказ #{order.id} {status_text.get(data.status, data.status)}!")

    return OrderOut(
        id=order.id, user_id=order.user_id, items=order.items, status=order.status,
        total_price=order.total_price, created_at=order.created_at,
        user_name=user.name if user else ""
    )


@router.put("/{order_id}/cancel-item")
def cancel_item(order_id: int, data: CancelItem, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if data.item_idx < 0 or data.item_idx >= len(order.items):
        raise HTTPException(status_code=400, detail="Invalid item index")
    order.items[data.item_idx]["cancelled"] = True
    order.items[data.item_idx]["cancel_reason"] = data.reason
    active_items = [i for i in order.items if not i.get("cancelled")]
    order.total_price = sum(i["price"] * i["qty"] for i in active_items)
    log = OrderLog(order_id=order.id, action=f"cancel_item:{data.item_idx}", reason=data.reason)
    db.add(log)
    db.commit()

    user = db.query(User).filter(User.id == order.user_id).first()
    if user:
        item_name = order.items[data.item_idx]["name"]
        notify_user(user.telegram_id, order.id, f'Позиция "{item_name}" отменена')

    return {"ok": True, "items": order.items, "total_price": order.total_price}


@router.put("/{order_id}/cancel")
def cancel_order(order_id: int, data: CancelOrder, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "cancelled"
    log = OrderLog(order_id=order.id, action="cancelled", reason=data.reason)
    db.add(log)
    db.commit()

    user = db.query(User).filter(User.id == order.user_id).first()
    if user:
        notify_user(user.telegram_id, order.id, f"Ваш заказ #{order.id} отменён. Причина: {data.reason}")

    return {"ok": True}


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    orders_today = db.query(Order).filter(Order.created_at >= today).count()
    revenue = db.query(func.sum(Order.total_price)).filter(
        Order.created_at >= today, Order.status != "cancelled"
    ).scalar() or 0

    all_orders = db.query(Order).filter(Order.created_at >= today, Order.status != "cancelled").all()
    item_counts = {}
    for o in all_orders:
        for item in o.items:
            if not item.get("cancelled"):
                name = item["name"]
                item_counts[name] = item_counts.get(name, 0) + item["qty"]
    popular = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return StatsOut(
        orders_today=orders_today,
        revenue_today=float(revenue),
        popular_items=[{"name": n, "count": c} for n, c in popular]
    )
