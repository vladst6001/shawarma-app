from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    category: str
    price: float
    image_url: str = ""


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    active: Optional[bool] = None


class MenuItemOut(BaseModel):
    id: int
    name: str
    description: str
    category: str
    price: float
    image_url: str
    active: bool

    class Config:
        from_attributes = True


class OrderItem(BaseModel):
    name: str
    qty: int
    price: float
    cancelled: bool = False
    cancel_reason: str = ""


class OrderCreate(BaseModel):
    items: List[OrderItem]


class OrderOut(BaseModel):
    id: int
    user_id: int
    items: list
    status: str
    total_price: float
    created_at: datetime
    user_name: str = ""

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str


class CancelItem(BaseModel):
    item_idx: int
    reason: str


class CancelOrder(BaseModel):
    reason: str


class UserOut(BaseModel):
    id: int
    telegram_id: int
    name: str
    role: str

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    orders_today: int
    revenue_today: float
    popular_items: list
