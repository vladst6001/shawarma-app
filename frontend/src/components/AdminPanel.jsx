import React, { useState, useEffect } from 'react'
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem, getStats } from '../api'

const CATEGORIES = [
  { id: 'shawarma', name: 'Шаурма' },
  { id: 'snacks', name: 'Закуски' },
  { id: 'drinks', name: 'Напитки' },
  { id: 'hot', name: 'Горячее' },
];

export default function AdminPanel({ onBack }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('menu');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'shawarma', price: '' });

  const loadMenu = () => getMenu().then(setItems).catch(() => {});
  const loadStats = () => getStats().then(setStats).catch(() => {});

  useEffect(() => { loadMenu(); loadStats(); }, []);

  const handleSave = async () => {
    try {
      const data = { ...form, price: parseFloat(form.price) };
      if (editItem) {
        await updateMenuItem(editItem.id, data);
      } else {
        await createMenuItem(data);
      }
      setShowAdd(false);
      setEditItem(null);
      setForm({ name: '', description: '', category: 'shawarma', price: '' });
      loadMenu();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить блюдо?')) return;
    try {
      await deleteMenuItem(id);
      loadMenu();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description, category: item.category, price: String(item.price) });
    setShowAdd(true);
  };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>⚙️ Админ</h2>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}>Меню</button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => { setTab('stats'); loadStats(); }}>Статистика</button>
      </div>

      {tab === 'menu' && (
        <div className="admin-menu">
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', description: '', category: 'shawarma', price: '' }); setShowAdd(true); }}>
            + Добавить блюдо
          </button>

          {showAdd && (
            <div className="modal-overlay" onClick={() => setShowAdd(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{editItem ? 'Редактировать' : 'Добавить блюдо'}</h3>
                <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" placeholder="Цена" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Отмена</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={!form.name || !form.price}>Сохранить</button>
                </div>
              </div>
            </div>
          )}

          <div className="admin-items-list">
            {items.map(item => (
              <div key={item.id} className="admin-item">
                <div className="admin-item-info">
                  <span className="admin-item-name">{item.name}</span>
                  <span className="admin-item-price">{item.price} ₽</span>
                  <span className="admin-item-cat">{item.category}</span>
                </div>
                <div className="admin-item-actions">
                  <button onClick={() => handleEdit(item)}>✏️</button>
                  <button onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.orders_today}</div>
            <div className="stat-label">Заказов за день</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.revenue_today} ₽</div>
            <div className="stat-label">Выручка</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Популярные блюда</div>
            {stats.popular_items.map((item, i) => (
              <div key={i} className="popular-item">{item.name} — {item.count} шт.</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
