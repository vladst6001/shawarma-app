import React, { useState, useEffect } from 'react'
import { getActiveOrders, updateOrderStatus, cancelItem, cancelOrder } from '../api'
import OrderCard from './OrderCard'

export default function CookPanel({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    getActiveOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status, 0);
      loadOrders();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleCancelItem = async (orderId, itemIdx, reason) => {
    try {
      await cancelItem(orderId, itemIdx, reason);
      loadOrders();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await cancelOrder(orderId, reason);
      loadOrders();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  return (
    <div className="cook-panel">
      <div className="panel-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>👨‍🍳 Заказы</h2>
        <button className="refresh-btn" onClick={loadOrders}>↻</button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="empty">Нет активных заказов</div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatus={handleStatus}
              onCancelItem={handleCancelItem}
              onCancelOrder={handleCancelOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
