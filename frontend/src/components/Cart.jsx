import React from 'react'
import { createOrder } from '../api'

export default function Cart({ cart, onUpdateQty, onClear, onOrder, telegramId, fullPage, onBack }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleOrder = async () => {
    try {
      const items = cart.map(c => ({ name: c.name, qty: c.qty, price: c.price }));
      const order = await createOrder(items, telegramId || 0);
      onOrder(order);
    } catch (e) {
      alert('Ошибка создания заказа: ' + e.message);
    }
  };

  return (
    <div className={`cart ${fullPage ? 'cart-full' : ''}`}>
      {fullPage && (
        <div className="cart-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Корзина</h2>
        </div>
      )}

      {!fullPage && <div className="cart-title">🛒 Корзина ({cart.length})</div>}

      <div className="cart-items">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-price">{item.price * item.qty} ₽</span>
            </div>
            <div className="cart-item-controls">
              <button className="qty-btn" onClick={() => onUpdateQty(item.id, -1)}>−</button>
              <span className="qty">{item.qty}</span>
              <button className="qty-btn" onClick={() => onUpdateQty(item.id, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <span>Итого:</span>
        <span className="total-price">{total} ₽</span>
      </div>

      <button className="btn btn-order" onClick={handleOrder} disabled={cart.length === 0}>
        Оформить заказ
      </button>

      {cart.length > 0 && (
        <button className="btn btn-clear" onClick={onClear}>
          Очистить корзину
        </button>
      )}
    </div>
  );
}
