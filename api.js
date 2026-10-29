// api.js

// !!! ВАЖНО: Замени на своё имя и фамилию латиницей (например, gleb-fokin) !!!
const PERSONAL_KEY = "ivan-dmitriev"; 

const API_BASE = `https://wedev-api.sky.pro/api/v2/${PERSONAL_KEY}`;

export async function fetchComments() {
  const url = `${API_BASE}/comments`;
  
  // Для GET-запроса заголовки вообще не нужны
  const res = await fetch(url);
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Ошибка загрузки: ${res.status}`);
  }
  
  const data = await res.json();
  return data.comments || [];
}

export async function addCommentToApi(text) {
  const url = `${API_BASE}/comments`;
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("Нет токена авторизации. Сначала войдите.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      // ГЛАВНОЕ ИСПРАВЛЕНИЕ:
      // Убираем "Content-Type": "application/json" — этот API его не любит!
      
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ text }), // Тело оставляем в формате JSON-строки
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Если ошибка про JSON — это именно из-за заголовка, который мы убрали
    throw new Error(data?.error || data?.message || `Ошибка добавления: ${res.status}`);
  }

  return res.json();
}
