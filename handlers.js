// handlers.js
import { isLoggedIn, loginUser, clearToken } from "./auth.js";
import { fetchComments, addCommentToApi } from "./api.js";
import { renderComments } from "./render-comments.js"; // Предполагаем, что у тебя есть этот файл

let _nameInput, _textInput, _addButton, _commentsList, _authFormEl, _userProfile;

export function initHandlers(nameInput, textInput, addButton, commentsList) {
  _nameInput = nameInput;
  _textInput = textInput;
  _addButton = addButton;
  _commentsList = commentsList;

  loadComments();
  updateAuthUI();
}

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

function createLoginForm() {
  const container = document.createElement("div");
  container.className = "auth-component";
  container.style.padding = "20px";
  container.style.border = "1px solid #444";
  container.style.backgroundColor = "#2b2b2b";
  container.style.color = "#fff";
  container.style.maxWidth = "320px";
  container.style.margin = "0 auto 24px";

  container.innerHTML = `
    <h3>Вход</h3>
    <p style="font-size: 13px; color: #aaa;">Для теста: admin / admin</p>
    <input type="text" class="login-input" placeholder="Логин" style="width: 100%; margin-bottom: 8px; padding: 6px;">
    <input type="password" class="password-input" placeholder="Пароль" style="width: 100%; margin-bottom: 12px; padding: 6px;">
    <button type="button" class="submit-btn" style="padding: 8px 16px; cursor: pointer; background: #4CAF50; color: white; border: none;">Войти</button>
    <div class="status" style="margin-top: 8px; font-size: 13px;"></div>
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
      updateAuthUI(); // Перерисовываем интерфейс
      loadComments(); // Обновляем ленту (теперь видны лайки)
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

  // 1. УПРАВЛЕНИЕ ФОРМОЙ ВХОДА
  if (loggedIn) {
    // Если вошли — удаляем форму входа, если она есть
    if (_authFormEl) {
      _authFormEl.remove();
      _authFormEl = null;
    }
  } else {
    // Если не вошли — показываем форму входа (если её ещё нет)
    if (!_authFormEl) {
      _authFormEl = createLoginForm();
      const addForm = document.querySelector(".add-form");
      if (addForm) {
        addForm.parentNode.insertBefore(_authFormEl, addForm);
      } else {
        document.querySelector(".container")?.prepend(_authFormEl);
      }
    }
  }

  // 2. УПРАВЛЕНИЕ ФОРМОЙ ДОБАВЛЕНИЯ КОММЕНТАРИЯ
  const formWrapper = _nameInput?.closest(".add-form");
  
  if (formWrapper) {
    formWrapper.style.display = loggedIn ? "block" : "none";
  }
  
  if (_addButton) {
    _addButton.style.display = loggedIn ? "inline-block" : "none";
  }

  // 3. ЗАПОЛНЕНИЕ ИМЕНИ (только для авторизованных)
  if (_nameInput && _userProfile) {
    _nameInput.value = _userProfile.name || "Пользователь";
    _nameInput.readOnly = true; // Запрет изменения имени
    _nameInput.style.opacity = "0.7";
    _nameInput.style.cursor = "not-allowed";
  } else if (_nameInput) {
    _nameInput.readOnly = false;
    _nameInput.style.opacity = "1";
    _nameInput.style.cursor = "auto";
  }

  // 4. КНОПКА "ВЫЙТИ"
  let logoutBtn = document.querySelector(".logout-btn");
  if (loggedIn) {
    if (!logoutBtn) {
      logoutBtn = document.createElement("button");
      logoutBtn.className = "logout-btn";
      logoutBtn.style.margin = "10px auto";
      logoutBtn.style.padding = "8px 16px";
      logoutBtn.style.cursor = "pointer";
      logoutBtn.textContent = "Выйти";
      
      // Вставляем кнопку рядом с формой добавления
      const target = document.querySelector(".add-form") || document.querySelector(".container");
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

// Обработчик кнопки "Добавить"
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
    _textInput.value = ""; // Очищаем поле
    loadComments(); // Перезагружаем ленту, чтобы увидеть новый коммент
  } catch (e) {
    console.error(e);
    alert(`Не удалось добавить комментарий: ${e.message}`);
  }
}
