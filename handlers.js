import { createQuotedText, escapeHtml } from "./utils.js";
import { renderComments } from "./render-comments.js";
import { fetchComments, addCommentToApi } from "./api.js";

const initialComments = [
  {
    name: "Глеб Фокин",
    date: "12.02.22 12:18",
    text: "Это будет первый комментарий на этой странице",
    likes: 3,
    isLiked: false,
  },
  {
    name: "Варвара Н.",
    date: "13.02.22 19:22",
    text: "Мне нравится, как оформлена эта страница! ❤",
    likes: 75,
    isLiked: true,
  },
];

let _nameInput, _textInput, _commentsList, _commentsData = [];

export function attachCommentClicks() {
  _commentsList.querySelectorAll(".comment").forEach((li) => {
    li.addEventListener("click", (e) => {
      if (e.target.closest(".like-button")) return;
      const index = parseInt(li.getAttribute("data-index"), 10);
      const comment = _commentsData[index];
      if (!comment) return;
      _textInput.value = createQuotedText(comment.name, comment.text);
      _textInput.focus();
    });
  });
}

export function attachLikeButtons() {
  _commentsList.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const parentLi = e.currentTarget.closest(".comment");
      const index = parseInt(parentLi.getAttribute("data-index"), 10);
      if (index >= 0 && index < _commentsData.length) {
        const comment = _commentsData[index];
        comment.isLiked = !comment.isLiked;
        comment.likes = comment.isLiked ? comment.likes + 1 : comment.likes - 1;
        render();
      }
    });
  });
}

export function render() {
  renderComments(_commentsList, _commentsData);
  attachCommentClicks();
  attachLikeButtons();
}

export async function initHandlers(nameInput, textInput, addButton, commentsList) {
  _nameInput = nameInput;
  _textInput = textInput;
  _commentsList = commentsList;

  _commentsData = [...initialComments];
  render();

  try {
    const apiComments = await fetchComments();
    if (Array.isArray(apiComments) && apiComments.length > 0) {
      _commentsData = apiComments;
      render();
    }
  } catch (err) {
    console.warn("API недоступен, работаем с локальными комментариями:", err.message);
  }

  addButton.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) return;
    if (name.length < 3 || text.length < 3) {
      alert("Имя и текст должны быть не короче 3 символов.");
      return;
    }

    const safeName = escapeHtml(name);
    const safeText = escapeHtml(text);

    _commentsData.push({
      name: safeName,
      text: safeText,
      date: new Date().toLocaleString("ru-RU"),
      likes: 0,
      isLiked: false,
    });
    render();
    nameInput.value = "";
    textInput.value = "";

    try {
      await addCommentToApi(safeName, safeText);
      const fresh = await fetchComments();
      if (Array.isArray(fresh) && fresh.length > 0) {
        _commentsData = fresh;
        render();
      }
    } catch (err) {
      console.error("Не удалось отправить на API:", err.message);
    }
  });
}