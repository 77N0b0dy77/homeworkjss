const API_BASE = "https://wedev-api.sky.pro/api/v1";
const PERSONAL_KEY = "ivan-dmitriev";

export function fetchComments() {
  const url = `${API_BASE}/${PERSONAL_KEY}/comments`;
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          const msg = data?.error ? data.error : `Ошибка загрузки: ${res.status}`;
          throw new Error(msg);
        }).catch(() => {
          // Если JSON не распарсился, кидаем ошибку со статусом
          throw new Error(`Ошибка загрузки: ${res.status}`);
        });
      }
      return res.json();
    })
    .then((data) => {
      const commentsArray = Array.isArray(data.comments) ? data.comments : [];
      return commentsArray.map((c) => ({
        id: c.id,
        name: c.author?.name || "Аноним",
        text: c.text || "",
        date: formatDateFromISO(c.date),
        likes: Number(c.likes) || 0,
        isLiked: Boolean(c.isLiked),
      }));
    });
}


export function addCommentToApi(name, text) {
  const url = `${API_BASE}/${PERSONAL_KEY}/comments`;
  // Тело — валидный JSON (обязательно)
  const bodyPayload = JSON.stringify({ name, text });

  return fetch(url, {
    method: "POST",
    // ВАЖНО: никаких headers: { "Content-Type": ... }
    body: bodyPayload,
  })
    .then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          const msg = data?.error || data?.message || `Ошибка ${res.status}`;
          throw new Error(msg);
        }).catch(() => {
          throw new Error(`Ошибка ${res.status}`);
        });
      }
      return res.json();
    });
}

function formatDateFromISO(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}