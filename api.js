const PERSONAL_KEY = "ivan-dmitriev"; // <-- Убедись, что это ТВОЙ ключ латиницей!
const API_BASE = `https://wedev-api.sky.pro/api/v2/${PERSONAL_KEY}`;

export async function fetchComments() {
  const url = `${API_BASE}/comments`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ошибка загрузки комментариев: ${res.status} ${text.slice(0, 100)}`);
  }
  
  const data = await res.json().catch(() => ({}));
  return data.comments || [];
}

export async function sendCommentToApi(text, name) {
  const token = localStorage.getItem("auth_token");
  
  if (!token) {
    throw new Error("Вы не авторизованы. Пожалуйста, войдите в систему.");
  }

  const cleanText = (text || "").trim();
  const cleanName = (name || "").trim();

  if (cleanText.length < 3) {
    throw new Error("Комментарий должен быть не короче 3 символов.");
  }
  if (!cleanName) {
    throw new Error("Имя пользователя не может быть пустым.");
  }

  // ВАЖНО: Только JSON, никаких FormData!
  const payload = {
    text: cleanText,
    name: cleanName,
  };

  const url = `${API_BASE}/comments`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Обязательно для этого API
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload), // Строка JSON
  });

  let errorMessage = `Ошибка сервера: ${res.status}`;
  let responseData;

  // Читаем ответ только ОДИН раз
  try {
    responseData = await res.json();
    errorMessage = responseData.message || responseData.error || responseData.msg || errorMessage;
  } catch (e) {
    // Если сервер вернул не JSON (например, HTML-ошибку), читаем как текст
    const textBody = await res.text().catch(() => "");
    if (textBody) {
      errorMessage += " " + textBody.slice(0, 200);
    }
  }

  if (!res.ok) {
    throw new Error(errorMessage);
  }

  return responseData || {};
}