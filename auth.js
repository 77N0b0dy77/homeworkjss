// auth.js
const API_BASE_USER = "https://wedev-api.sky.pro/api"; // Путь для авторизации (без v2)

export function isLoggedIn() {
  return !!localStorage.getItem("auth_token");
}

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function setToken(token) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export async function loginUser(login, password) {
  const url = `${API_BASE_USER}/user/login`;
  
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.error || data?.message || `Ошибка входа: ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const user = data.user;
  const token = user?.token;

  if (!token) throw new Error("Сервер не вернул токен");

  setToken(token);
  return user; // Возвращаем имя пользователя
}
