const API = '';

export async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

export async function getMenu(category) {
  const q = category ? `?category=${category}` : '';
  return api(`/api/menu/${q}`);
}

export async function createOrder(items, telegramId) {
  return api(`/api/orders/?telegram_id=${telegramId}`, {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}

export async function getMyOrders(telegramId) {
  return api(`/api/orders/my?telegram_id=${telegramId}`);
}

export async function getActiveOrders() {
  return api('/api/orders/active');
}

export async function updateOrderStatus(orderId, status, telegramId) {
  return api(`/api/orders/${orderId}/status?telegram_id=${telegramId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

export async function cancelItem(orderId, itemIdx, reason) {
  return api(`/api/orders/${orderId}/cancel-item`, {
    method: 'PUT',
    body: JSON.stringify({ item_idx: itemIdx, reason })
  });
}

export async function cancelOrder(orderId, reason) {
  return api(`/api/orders/${orderId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });
}

export async function getStats() {
  return api('/api/orders/stats');
}

export async function createMenuItem(data) {
  return api('/api/menu/', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateMenuItem(id, data) {
  return api(`/api/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteMenuItem(id) {
  return api(`/api/menu/${id}`, { method: 'DELETE' });
}

export async function login(initData) {
  return api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ initData })
  });
}
