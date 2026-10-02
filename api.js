const API_BASE = "https://wedev-api.sky.pro/api/v1";
const PERSONAL_KEY = "ivan-dmitriev";

export async function fetchComments() {
  const url = `${API_BASE}/${PERSONAL_KEY}/comments`;
  
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `Ошибка загрузки: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (e) {}
    throw new Error(msg);
  }

  const data = await res.json();
  const commentsArray = Array.isArray(data.comments) ? data.comments : [];

  return commentsArray.map(c => ({
    id: c.id,
    name: c.author?.name || "Аноним",
    text: c.text || "",
    date: formatDateFromISO(c.date),
    likes: Number(c.likes) || 0,
    isLiked: Boolean(c.isLiked),
  }));
}

export async function addCommentToApi(name, text) {
  const url = `${API_BASE}/${PERSONAL_KEY}/comments`;


  const bodyPayload = JSON.stringify({ name, text });

  const res = await fetch(url, {
    method: "POST",
    body: bodyPayload,
  });

  if (!res.ok) {
    let msg = `Ошибка ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (e) {}
    throw new Error(msg);
  }

  return await res.json();
}

export function formatDateFromISO(isoString) {
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