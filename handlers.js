import { isLoggedIn, loginUser, clearToken, registerUser } from "./auth.js";
import { fetchComments, addCommentToApi } from "./api.js";
import { renderComments } from "./render-comments.js";

let _nameInput,
  _textInput,
  _addButton,
  _commentsList,
  _authPlaceholder,
  _userProfile;
let _isLoginFormVisible = false;
let _isRegisterFormVisible = false; // отслеживаем, открыта ли форма входа

export async function loadComments() {
  if (!_commentsList) return;
  _commentsList.classList.add("loading");
  try {
    const comments = await fetchComments();
    renderComments(_commentsList, comments);
  } catch (e) {
    console.error(e);
    _commentsList.innerHTML = `<li class="comment-empty" style="color:red">Ошибка: ${e.message}</li>`;
  } finally {
    _commentsList.classList.remove("loading");
  }
}

export function initHandlers(
  nameInput,
  textInput,
  addButton,
  commentsList,
  authPlaceholder,
) {
  _nameInput = nameInput;
  _textInput = textInput;
  _addButton = addButton;
  _commentsList = commentsList;
  _authPlaceholder = authPlaceholder;

  loadComments();
  updateAuthUI();
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

function createLoginForm() {
  const container = document.createElement("div");
  container.className = "auth-panel";
  container.innerHTML = `
  <h3>Вход</h3>
  <p class="hint">Для теста: admin / admin</p>
  <input type="text" class="auth-input login-input" placeholder="Логин">
  <input type="password" class="auth-input password-input" placeholder="Пароль">
  <!-- Одинаковый класс для кнопки -->
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
      _isLoginFormVisible = false;
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

function createGuestMessage() {
  const el = document.createElement("div");
  el.className = "guest-message";
  el.innerHTML = `
  <strong>Авторизуйтесь, чтобы оставлять комментарии</strong>
  <p style="margin:10px 0;">Для теста: admin / admin</p>
  <div style="display:flex; gap:10px; flex-wrap:wrap;">
    <button type="button" class="auth-btn guest-action-btn" id="show-login-btn">Войти</button>
    <button type="button" class="auth-btn guest-action-btn" id="show-register-btn">Регистрация</button>
  </div>
`;

  el.querySelector("#show-login-btn").addEventListener("click", () => {
    _isLoginFormVisible = true;
    _isRegisterFormVisible = false;
    updateAuthUI();
  });

  el.querySelector("#show-register-btn").addEventListener("click", () => {
    _isLoginFormVisible = false;
    _isRegisterFormVisible = true;
    updateAuthUI();
  });

  return el;
}

function createRegisterForm() {
  const container = document.createElement("div");
  container.className = "auth-panel";
  container.innerHTML = `
  <h3>Регистрация</h3>
  <input type="text" class="auth-input register-name" placeholder="Имя (для отображения)">
  <input type="text" class="auth-input register-login" placeholder="Логин (уникальный)">
  <input type="password" class="auth-input register-password" placeholder="Пароль">
  <!-- Тот же самый класс -->
  <button type="button" class="auth-btn submit-btn">Зарегистрироваться</button>
  <div class="status" style="margin-top:12px; font-size:13px; text-align:center;"></div>
  <p style="font-size:12px; color:#777; margin-top:8px;">Уже есть аккаунт? <a href="#" class="switch-to-login">Войти</a></p>
`;

  const switchToLogin = container.querySelector(".switch-to-login");
  switchToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    _isRegisterFormVisible = false;
    _isLoginFormVisible = true;
    updateAuthUI();
  });

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
      _isRegisterFormVisible = false;
      _isLoginFormVisible = false;
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

function updateAuthUI() {
  const loggedIn = isLoggedIn();

  // Очищаем блок авторизации перед перерисовкой
  _authPlaceholder.innerHTML = "";

  if (loggedIn) {
    // Пользователь авторизован: ничего не показываем в блоке авторизации
    _isLoginFormVisible = false;
    _isRegisterFormVisible = false;
  } else if (_isRegisterFormVisible) {
    // Показываем форму регистрации
    const form = createRegisterForm();
    _authPlaceholder.appendChild(form);
  } else if (_isLoginFormVisible) {
    // Показываем форму входа
    const form = createLoginForm();
    _authPlaceholder.appendChild(form);
  } else {
    // Не авторизован и формы не открыты: показываем блок-приглашение
    const guest = createGuestMessage();
    _authPlaceholder.appendChild(guest);
  }

  // --- Дальше идёт старый код, который менять не надо (про форму комментария и кнопку «Выйти») ---

  // 2. Форма добавления комментария (видна только авторизованным)
  const addForm = document.getElementById("add-comment-form");
  if (addForm) {
    addForm.style.display = loggedIn ? "block" : "none";
  }

  // 3. Заполнение имени (только для авторизованных)
  if (_nameInput && _userProfile) {
    _nameInput.value = _userProfile.name || "Пользователь";
    _nameInput.readOnly = true;
    _nameInput.style.opacity = "0.7";
    _nameInput.style.cursor = "not-allowed";
  } else if (_nameInput) {
    _nameInput.readOnly = false;
    _nameInput.style.opacity = "1";
    _nameInput.style.cursor = "auto";
    _nameInput.value = "";
  }

  // 4. Кнопка «Выйти»
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

      const target =
        document.getElementById("add-comment-form") ||
        document.querySelector(".container");
      target?.parentNode?.insertBefore(logoutBtn, target?.nextSibling);
    }
    logoutBtn.style.display = "inline-block";
    logoutBtn.onclick = () => {
      clearToken();
      _userProfile = null;
      _isLoginFormVisible = false;
      _isRegisterFormVisible = false; // важно сбросить и это
      updateAuthUI();
      loadComments();
    };
  } else if (logoutBtn) {
    logoutBtn.style.display = "none";
  }
}

export async function handleAddComment() {
  if (!isLoggedIn()) {
    alert("Сначала авторизуйтесь!");
    return;
  }

  const text = _textInput?.value.trim();
  if (!text || text.length < 3) {
    alert("Текст комментария должен быть длиннее 3 символов.");
    return;
  }

  try {
    await addCommentToApi(text);
    _textInput.value = "";
    loadComments();
  } catch (e) {
    console.error(e);
    alert(`Не удалось добавить комментарий: ${e.message}`);
  }
}
