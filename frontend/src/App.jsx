import React, { useState, useEffect } from 'react'
import Menu from './components/Menu'
import Cart from './components/Cart'
import CookPanel from './components/CookPanel'
import AdminPanel from './components/AdminPanel'
import { login } from './api'

const tg = window.Telegram?.WebApp;

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [screen, setScreen] = useState('menu');
  const [lastOrder, setLastOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0a0a0a');
      tg.setBackgroundColor('#0a0a0a');
    }

    const initData = tg?.initData || '';
    login(initData).then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => {
      setUser({ id: 1, telegram_id: 123456789, name: 'Test', role: 'admin' });
      setLoading(false);
    });
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0);
    });
  };

  const clearCart = () => setCart([]);

  if (loading) return <div className="loading">Загрузка...</div>;

  const isCook = user?.role === 'cook' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="app">
      {screen === 'menu' && (
        <>
          <Menu onAdd={addToCart} />
          {cart.length > 0 && (
            <Cart
              cart={cart}
              onUpdateQty={updateQty}
              onClear={clearCart}
              onOrder={(order) => { setLastOrder(order); setScreen('order'); setCart([]); }}
              telegramId={user?.telegram_id}
            />
          )}
          {isCook && (
            <button className="btn btn-cook" onClick={() => setScreen('cook')}>
              👨‍🍳 Панель повара
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-admin" onClick={() => setScreen('admin')}>
              ⚙️ Админ-панель
            </button>
          )}
        </>
      )}

      {screen === 'cart' && (
        <Cart
          cart={cart}
          onUpdateQty={updateQty}
          onClear={clearCart}
          onOrder={(order) => { setLastOrder(order); setScreen('order'); setCart([]); }}
          telegramId={user?.telegram_id}
          fullPage
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'order' && lastOrder && (
        <OrderComplete order={lastOrder} onBack={() => setScreen('menu')} />
      )}

      {screen === 'cook' && (
        <CookPanel onBack={() => setScreen('menu')} />
      )}

      {screen === 'admin' && (
        <AdminPanel onBack={() => setScreen('menu')} />
      )}
    </div>
  );
}

function OrderComplete({ order, onBack }) {
  return (
    <div className="order-complete">
      <div className="order-success">✅</div>
      <h2>Заказ оформлен!</h2>
      <div className="order-number">#{order.id}</div>
      <p className="order-status">Статус: <span className="badge badge-new">Новый</span></p>
      <button className="btn btn-primary" onClick={() => window.print?.()}>
        🖨 Напечатать чек
      </button>
      <button className="btn btn-secondary" onClick={onBack}>
        ← Вернуться в меню
      </button>
    </div>
  );
}

export default App
