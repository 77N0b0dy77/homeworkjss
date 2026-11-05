const PERSONAL_KEY = "ivan-dmitriev";
const API_BASE = `https://wedev-api.sky.pro/api/v2/${PERSONAL_KEY}`;

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(
      data.message || data.error || `Ошибка сервера: ${res.status}`
    );
  }

  return data;
}

export async function fetchComments() {
  const data = await request(`${API_BASE}/comments`);
  return data.comments || [];
}

export async function sendCommentToApi(text, name) {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("Необходимо авторизоваться");
  }

  const cleanText = (text || "").trim();

  if (cleanText.length < 3) {
    throw new Error("Комментарий должен содержать минимум 3 символа");
  }

  return await request(`${API_BASE}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: cleanText,
    }),
  });
}

export async function toggleLikeApi(commentId) {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("Для лайка необходимо авторизоваться");
  }

  return await request(
    `${API_BASE}/comments/${commentId}/toggle-like`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function deleteCommentApi(commentId) {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("Для удаления необходимо авторизоваться");
  }

  return await request(`${API_BASE}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}