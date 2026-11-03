import { fetchComments, sendCommentToApi } from "./api.js";
import { loginUser, registerUser, isLoggedIn, clearToken, getToken } from "./auth.js";

let _nameInput = null;
let _textInput = null;
let _addButton = null;
let _commentsList = null;
let _authScreen = null;
let _userProfile = null;

function initHandlers(nameInput, textInput, addButton, commentsList, authUnderComments) {
  _nameInput = nameInput;
  _textInput = textInput;
  _addButton = addButton;
  _commentsList = commentsList;
  _authScreen = authUnderComments;

  loadComments();
  updateAuthUI();
}

async function loadComments() {
  if (!_commentsList) return;

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

  const safeText = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  commentsData.forEach(comment => {
    const authorName = comment.author?.name || comment.name || "Пользователь";
    const li = document.createElement("li");
    li.className = "comment";
    li.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${safeText(authorName)}</span>
        <span class="comment-date">${formatDateFromISO(comment.date)}</span>
      </div>
      <div class="comment-body">
        <div class="comment-text">${safeText(comment.text)}</div>
      </div>
      <div class="comment-footer">
        <div class="likes">
          <span class="likes-counter">${comment.likes || 0}</span>
          <button class="like-button" aria-label="Нравится"></button>
        </div>
      </div>
    `;
    listElement.appendChild(li);
  });
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();

  const addForm = document.getElementById("add-comment-form");
  if (addForm) addForm.style.display = loggedIn ? "block" : "none";

  if (loggedIn) {
    _commentsList?.classList.remove("comments--hidden");
    _authScreen.innerHTML = "";

    if (_nameInput && _userProfile) {
      _nameInput.value = _userProfile.name || "Пользователь";
      _nameInput.readOnly = true;
    }

    renderLogoutButton();
  } else {
    _nameInput.value = "";
    _nameInput.readOnly = true;
    renderGuestMessage();
  }
}

function renderGuestMessage() {
  if (!_authScreen) return;
  _authScreen.innerHTML = "";

  const el = document.createElement("div");
  el.className = "guest-message";
  el.innerHTML = `
    <p class="guest-text">
      Чтобы оставить комментарий, <span class="guest-link" id="go-to-login">войдите</span>
    </p>
  `;
  el.querySelector("#go-to-login").addEventListener("click", () => {
    showAuthScreen("login");
  });

  _authScreen.appendChild(el);
}

function showAuthScreen(mode) {
  if (!_authScreen) return;

  _commentsList?.classList.add("comments--hidden");
  _authScreen.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "auth-screen";

  if (mode === "login") {
    panel.innerHTML = `
      <h3>Вход</h3>
      <div class="auth-fields">
        <input type="text" class="auth-input login-input" placeholder="Логин">
        <input type="password" class="auth-input password-input" placeholder="Пароль">
      </div>
      <button type="button" class="auth-btn submit-btn">Войти</button>
      <div class="status"></div>
      <p class="auth-switch">
        Нет аккаунта?
        <span class="guest-link" id="switch-to-register">Зарегистрироваться</span>
      </p>
      <p class="auth-back">
        <span class="guest-link" id="back-to-comments">← Вернуться к комментариям</span>
      </p>
    `;

    panel.querySelector("#switch-to-register").addEventListener("click", () => showAuthScreen("register"));
    panel.querySelector("#back-to-comments").addEventListener("click", backToComments);

    panel.querySelector(".submit-btn").addEventListener("click", async () => {
      const status = panel.querySelector(".status");
      const login = panel.querySelector(".login-input").value.trim();
      const password = panel.querySelector(".password-input").value.trim();
      status.textContent = "Проверка...";
      try {
        const user = await loginUser(login, password);
        _userProfile = user;
        updateAuthUI();
        loadComments();
      } catch (e) {
        status.style.color = "red";
        status.textContent = e.message;
      }
    });
  } else {
    panel.innerHTML = `
      <h3>Регистрация</h3>
      <div class="auth-fields">
        <input type="text" class="auth-input register-name" placeholder="Имя (для отображения)">
        <input type="text" class="auth-input register-login" placeholder="Логин (уникальный)">
        <input type="password" class="auth-input register-password" placeholder="Пароль">
      </div>
      <button type="button" class="auth-btn submit-btn">Зарегистрироваться</button>
      <div class="status"></div>
      <p class="auth-switch">
        Уже есть аккаунт?
        <span class="guest-link" id="switch-to-login">Войти</span>
      </p>
      <p class="auth-back">
        <span class="guest-link" id="back-to-comments">← Вернуться к комментариям</span>
      </p>
    `;

    panel.querySelector("#switch-to-login").addEventListener("click", () => showAuthScreen("login"));
    panel.querySelector("#back-to-comments").addEventListener("click", backToComments);

    panel.querySelector(".submit-btn").addEventListener("click", async () => {
      const status = panel.querySelector(".status");
      const name = panel.querySelector(".register-name").value.trim();
      const login = panel.querySelector(".register-login").value.trim();
      const password = panel.querySelector(".register-password").value.trim();
      if (!name || !login || !password) {
        status.style.color = "red";
        status.textContent = "Заполните все поля";
        return;
      }
      status.textContent = "Отправка...";
      try {
        const user = await registerUser(name, login, password);
        _userProfile = user;
        updateAuthUI();
        loadComments();
      } catch (e) {
        status.style.color = "red";
        status.textContent = e.message;
      }
    });
  }

  _authScreen.appendChild(panel);
}

function backToComments() {
  _commentsList?.classList.remove("comments--hidden");
  renderGuestMessage();
}

function renderLogoutButton() {
  let logoutBtn = document.querySelector(".logout-btn");
  if (!logoutBtn) {
    logoutBtn = document.createElement("button");
    logoutBtn.className = "logout-btn";
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
}

async function handleAddComment() {
  if (!_textInput || !_nameInput) return;

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

export function formatDateFromISO(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export { initHandlers, handleAddComment };