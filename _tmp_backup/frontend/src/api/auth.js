const API = '/api';

export async function login(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen');
  return data;
}

export async function verifyToken(token) {
  const res = await fetch(`${API}/auth/verify`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  return data;
}

export function getToken() {
  return localStorage.getItem('pizzeria_token');
}

export function getUser() {
  try {
    const u = localStorage.getItem('pizzeria_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function saveAuth(token, user) {
  localStorage.setItem('pizzeria_token', token);
  localStorage.setItem('pizzeria_user', JSON.stringify(user));
  localStorage.setItem('pizzeria_login_time', Date.now().toString());
}

export function clearAuth() {
  localStorage.removeItem('pizzeria_token');
  localStorage.removeItem('pizzeria_user');
  localStorage.removeItem('pizzeria_login_time');
}

export function isTokenExpired() {
  const loginTime = localStorage.getItem('pizzeria_login_time');
  if (!loginTime) return true;
  const eightHours = 8 * 60 * 60 * 1000;
  return Date.now() - parseInt(loginTime) > eightHours;
}
