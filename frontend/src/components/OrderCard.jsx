import React, { useState } from 'react'

const STATUS_COLORS = {
  new: '#3b82f6',
  accepted: '#22c55e',
  cooking: '#eab308',
  ready: '#16a34a',
  cancelled: '#ef4444'
};

const STATUS_LABELS = {
  new: 'Новый',
  accepted: 'Принят',
  cooking: 'Готовится',
  ready: 'Готов',
  cancelled: 'Отменён'
};

export default function OrderCard({ order, onStatus, onCancelItem, onCancelOrder }) {
  const [selected, setSelected] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showItemsMenu, setShowItemsMenu] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelItemIdx, setCancelItemIdx] = useState(-1);

  const handleCancelItem = (idx) => {
    setCancelItemIdx(idx);
    setCancelReason('');
    setShowItemsMenu(false);
    setShowCancelModal(true);
  };

  const confirmCancelItem = () => {
    if (cancelItemIdx >= 0 && cancelReason.trim()) {
      onCancelItem(order.id, cancelItemIdx, cancelReason.trim());
      setShowCancelModal(false);
      setCancelItemIdx(-1);
    }
  };

  const handleCancelOrder = () => {
    setCancelReason('');
    setShowStatusMenu(false);
    setShowCancelModal(true);
    setCancelItemIdx(-1);
  };

  const confirmCancelOrder = () => {
    if (cancelReason.trim()) {
      onCancelOrder(order.id, cancelReason.trim());
      setShowCancelModal(false);
    }
  };

  return (
    <div className={`order-card ${selected ? 'selected' : ''}`} onClick={() => { setSelected(!selected); setShowStatusMenu(false); setShowItemsMenu(false); }}>
      <div className="order-card-header">
        <span className="order-num">#{order.id}</span>
        <span className="badge" style={{ background: STATUS_COLORS[order.status] }}>
          {STATUS_LABELS[order.status]}
        </span>
        <span className="order-time">{new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {order.user_name && <div className="order-user">{order.user_name}</div>}

      <div className="order-items-list">
        {order.items.map((item, idx) => (
          <div key={idx} className={`order-item ${item.cancelled ? 'cancelled' : ''}`}>
            <span>{item.qty}x {item.name}</span>
            {item.cancelled && <span className="cancel-badge">❌ {item.cancel_reason}</span>}
          </div>
        ))}
      </div>

      <div className="order-total">{order.total_price} ₽</div>

      {selected && (
        <div className="order-actions">
          <button className="action-btn action-status" onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); setShowItemsMenu(false); }}>
            ●
          </button>
          <button className="action-btn action-items" onClick={(e) => { e.stopPropagation(); setShowItemsMenu(!showItemsMenu); setShowStatusMenu(false); }}>
            •••
          </button>
          <button className="action-btn action-cancel" onClick={(e) => { e.stopPropagation(); handleCancelOrder(); }}>
            ✖
          </button>
        </div>
      )}

      {showStatusMenu && (
        <div className="status-menu" onClick={(e) => e.stopPropagation()}>
          <button className="status-opt" onClick={() => { onStatus(order.id, 'accepted'); setShowStatusMenu(false); }}>🟢 Принять</button>
          <button className="status-opt" onClick={() => { onStatus(order.id, 'cooking'); setShowStatusMenu(false); }}>🟡 Готовится</button>
          <button className="status-opt" onClick={() => { onStatus(order.id, 'ready'); setShowStatusMenu(false); }}>✅ Готово</button>
          <button className="status-opt status-cancel" onClick={handleCancelOrder}>❌ Отменить</button>
        </div>
      )}

      {showItemsMenu && (
        <div className="items-menu" onClick={(e) => e.stopPropagation()}>
          {order.items.map((item, idx) => (
            <div key={idx} className={`items-menu-item ${item.cancelled ? 'cancelled' : ''}`}>
              <span>{item.qty}x {item.name}</span>
              {!item.cancelled && (
                <button className="item-cancel-btn" onClick={() => handleCancelItem(idx)}>✖</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{cancelItemIdx >= 0 ? 'Отмена позиции' : 'Отмена заказа'}</h3>
            <textarea
              placeholder="Причина отмены..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Отмена</button>
              <button
                className="btn btn-danger"
                onClick={cancelItemIdx >= 0 ? confirmCancelItem : confirmCancelOrder}
                disabled={!cancelReason.trim()}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
