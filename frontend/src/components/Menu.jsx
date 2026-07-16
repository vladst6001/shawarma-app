import React, { useState, useEffect } from 'react'
import { getMenu } from '../api'

const CATEGORIES = [
  { id: 'shawarma', name: '🌯 Шаурма', emoji: '🌯' },
  { id: 'snacks', name: '🍟 Закуски', emoji: '🍟' },
  { id: 'drinks', name: '🥤 Напитки', emoji: '🥤' },
  { id: 'hot', name: '🍝 Горячее', emoji: '🍝' },
];

export default function Menu({ onAdd }) {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('shawarma');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMenu().then(setItems).catch(() => {
      setItems([
        { id: 1, name: 'Шаурма классическая', category: 'shawarma', price: 250, description: 'Курица, овощи, соус' },
        { id: 2, name: 'Шаурма с говядиной', category: 'shawarma', price: 320, description: 'Говядина, овощи, соус' },
        { id: 3, name: 'Чипсы из лаваша', category: 'snacks', price: 120, description: 'Хрустящие чипсы' },
        { id: 4, name: 'Кола 0.5л', category: 'drinks', price: 100, description: '' },
        { id: 5, name: 'Молочный коктейль', category: 'drinks', price: 150, description: 'Клубничный' },
        { id: 6, name: 'Макароны с сыром', category: 'hot', price: 200, description: 'Домашние макароны' },
      ]);
      setLoading(false);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => i.category === activeCategory && i.active !== false);

  return (
    <div className="menu">
      <div className="categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="menu-items">
        {loading ? (
          <div className="loading">Загрузка меню...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">Нет блюд в этой категории</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="menu-card" onClick={() => onAdd(item)}>
              <div className="menu-card-info">
                <div className="menu-card-name">{item.name}</div>
                {item.description && <div className="menu-card-desc">{item.description}</div>}
                <div className="menu-card-price">{item.price} ₽</div>
              </div>
              <button className="add-btn" onClick={(e) => { e.stopPropagation(); onAdd(item); }}>
                +
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
