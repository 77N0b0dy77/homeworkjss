import { fetchComments } from "./api.js";
import { sendCommentToApi } from "./api.js"; // <-- используем единую функцию
import { loginUser, registerUser, isLoggedIn, clearToken } from "./auth.js";

// 1. Глобальные переменные
let _nameInput = null;
let _textInput = null;
let _addButton = null;
let _commentsList = null;
let _authUnderComments = null;
let _userProfile = null;

const modalOverlay = document.getElementById("auth-modal-overlay");
const modalContent = document.getElementById("auth-modal-content");

function initHandlers(nameInput, textInput, addButton, commentsList, authUnderComments) {
  _nameInput = nameInput;
  _textInput = textInput;
  _addButton = addButton;
  _commentsList = commentsList;
  _authUnderComments = authUnderComments;

  loadComments();
  updateAuthUI();
}

async function loadComments() {
  if (!_commentsList) {
    console.warn("Контейнер .comments не найден");
    return;
  }

  try {
    const comments = await fetchComments();
    renderCommentsLocal(_commentsList, comments);
  } catch (e) {
    console.error("Ошибка загрузки комментариев:", e);
    _commentsList.innerHTML = `
      <li style="text-align:center; color:#d9534f; padding:16px;">
        Ошибка загрузки: ${e.message}
      </li>
    `;
  }
}

function renderCommentsLocal(listElement, commentsData) {
  if (!listElement) return;
  listElement.innerHTML = "";

  if (!commentsData || commentsData.length === 0) {
    listElement.innerHTML = "<li style='text-align:center; color:#777; padding:20px;'>Комментариев пока нет</li>";
    return;
  }

  commentsData.forEach(comment => {
    const dateStr = typeof formatDateFromISO === "function"
      ? formatDateFromISO(comment.date)
      : (comment.date || "—");

    const authorName = comment.author?.name || comment.name || "Пользователь";

    const safeText = (text) => {
      if (!text) return "";
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const li = document.createElement("li");
    li.className = "comment";
    li.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${safeText(authorName)}</span>
        <span class="comment-date">${dateStr}</span>
      </div>
      <div class="comment-body">
        <div class="comment-text">${safeText(comment.text)}</div>
      </div>
      <div class="comment-footer">
        <div class="likes">
          <span class="likes-counter">${comment.likes || 0}</span>
          <button class="like-button" data-comment-id="${comment.id}" aria-label="Нравится"></button>
        </div>
      </div>
    `;
    listElement.appendChild(li);
  });
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();

  if (_authUnderComments) {
    _authUnderComments.innerHTML = "";
    if (!loggedIn) {
      const el = document.createElement("div");
      el.className = "guest-message";
      el.innerHTML = `
        <strong>Для того чтобы оставить комментарий, авторизуйтесь</strong>
        <div class="guest-buttons" style="margin-top:16px;">
          <button type="button" class="auth-btn guest-action-btn" id="show-login-btn">Войти</button>
          <button type="button" class="auth-btn guest-action-btn" id="show-register-btn">Регистрация</button>
        </div>
      `;
      const loginBtn = el.querySelector("#show-login-btn");
      const regBtn = el.querySelector("#show-register-btn");
      if (loginBtn) loginBtn.addEventListener("click", () => openAuthModal("login"));
      if (regBtn) regBtn.addEventListener("click", () => openAuthModal("register"));
      _authUnderComments.appendChild(el);
    }
  }

  const addForm = document.getElementById("add-comment-form");
  if (addForm) {
    addForm.style.display = loggedIn ? "block" : "none";
  }

  if (_nameInput) {
    if (loggedIn && _userProfile) {
      _nameInput.value = _userProfile.name || "Пользователь";
      _nameInput.readOnly = true;
      _nameInput.style.opacity = "0.7";
      _nameInput.style.cursor = "not-allowed";
    } else {
      _nameInput.readOnly = false;
      _nameInput.style.opacity = "1";
      _nameInput.style.cursor = "auto";
      _nameInput.value = "";
    }
  }

  let logoutBtn = document.querySelector(".logout-btn");
  if (loggedIn) {
    if (!logoutBtn) {
      logoutBtn = document.createElement("button");
      logoutBtn.className = "logout-btn";
      logoutBtn.style.margin = "20px auto 0";
      logoutBtn.style.padding = "10px 20px";
      logoutBtn.style.background = "#333";
      logoutBtn.style.color = "#fff";
      logoutBtn.style.border = "none";
      logoutBtn.style.borderRadius = "12px";
      logoutBtn.style.cursor = "pointer";
      logoutBtn.textContent = "Выйти";
      const target = document.getElementById("add-comment-form") || document.querySelector(".container");
      target?.parentNode?.insertBefore(logoutBtn, target?.nextSibling);
    }
    logoutBtn.style.display = "inline-block";
    logoutBtn.onclick = () => {
      clearToken();
      _userProfile = null;
      updateAuthUI();
      loadComments();
    };
  } else if (logoutBtn) {
    logoutBtn.style.display = "none";
  }
}

function openAuthModal(mode) {
  if (!modalOverlay || !modalContent) {
    console.error("Элементы модального окна не найдены");
    return;
  }
  modalContent.innerHTML = "";
  modalContent.appendChild(mode === "login" ? createLoginForm() : createRegisterForm());
  modalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  if (modalOverlay) {
    modalOverlay.style.display = "none";
    document.body.style.overflow = "";
  }
}

document.getElementById("close-auth-modal")?.addEventListener("click", closeAuthModal);
modalOverlay?.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeAuthModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay?.style.display === "flex") {
    closeAuthModal();
  }
});

function createLoginForm() {
  const container = document.createElement("div");
  container.className = "auth-panel";
  container.innerHTML = `
    <h3>Вход</h3>
    <p class="hint">Для теста: admin / admin</p>
    <div class="auth-fields">
      <input type="text" class="auth-input login-input" placeholder="Логин">
      <input type="password" class="auth-input password-input" placeholder="Пароль">
    </div>
    <button type="button" class="auth-btn submit-btn">Войти</button>
    <div class="status" style="margin-top:12px; font-size:13px; text-align:center;"></div>
  `;
  const submitBtn = container.querySelector(".submit-btn");
  const statusBlock = container.querySelector(".status");
  submitBtn.addEventListener("click", async () => {
    statusBlock.textContent = "Проверка...";
    const login = container.querySelector(".login-input").value.trim();
    const password = container.querySelector(".password-input").value.trim();
    try {
      const user = await loginUser(login, password);
      _userProfile = user;
      closeAuthModal();
      updateAuthUI();
      loadComments();
    } catch (e) {
      console.error(e);
      statusBlock.style.color = "red";
      statusBlock.textContent = e.message;
    }
  });
  return container;
}

function createRegisterForm() {
  const container = document.createElement("div");
  container.className = "auth-panel";
  // ИСПРАВЛЕНА ОПИСКА: class="..."
  container.innerHTML = `
    <h3>Регистрация</h3>
    <div class="auth-fields">
      <input type="text" class="auth-input register-name" placeholder="Имя (для отображения)">
      <input type="text" class="auth-input register-login" placeholder="Логин (уникальный)">
      <input type="password" class="auth-input register-password" placeholder="Пароль">
    </div>
    <button type="button" class="auth-btn submit-btn">Зарегистрироваться</button>
    <div class="status" style="margin-top:12px; font-size:13px; text-align:center;"></div>
  `;
  const submitBtn = container.querySelector(".submit-btn");
  const statusBlock = container.querySelector(".status");
  submitBtn.addEventListener("click", async () => {
    const name = container.querySelector(".register-name").value.trim();
    const login = container.querySelector(".register-login").value.trim();
    const password = container.querySelector(".register-password").value.trim();
    if (!name || !login || !password) {
      statusBlock.style.color = "red";
      statusBlock.textContent = "Заполните все поля";
      return;
    }
    statusBlock.textContent = "Отправка...";
    try {
      const user = await registerUser(name, login, password);
      _userProfile = user;
      closeAuthModal();
      updateAuthUI();
      loadComments();
    } catch (e) {
      console.error(e);
      statusBlock.style.color = "red";
      statusBlock.textContent = e.message;
    }
  });
  return container;
}

async function handleAddComment() {
  if (!_textInput || !_nameInput) {
    console.warn("Элементы формы не найдены");
    return;
  }
  const text = _textInput.value.trim();
  const name = _nameInput.value.trim();
  if (text.length < 3) {
    alert("Комментарий должен быть минимум 3 символа");
    return;
  }
  try {
    await sendCommentToApi(text, name);
    _textInput.value = "";
    loadComments();
  } catch (e) {
    console.error("Ошибка при добавлении комментария:", e);
    alert("Не удалось добавить комментарий: " + (e.message || "Ошибка сети"));
  }
}

// ЕДИНСТВЕННЫЙ экспорт
export { initHandlers, handleAddComment };