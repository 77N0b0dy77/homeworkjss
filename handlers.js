import { createQuotedText, escapeHtml } from "./utils.js";
import { renderComments } from "./render-comments.js";
import { fetchComments, addCommentToApi } from "./api.js";

let _nameInput,
  _textInput,
  _commentsList,
  _commentsData = [];
let _addButton;

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

export function loadComments() {
  if (_commentsList) {
    _commentsList.classList.add("loading");
  }
  return fetchComments()
    .then((comments) => {
      _commentsData = Array.isArray(comments) ? comments : [];
      render();
    })
    .catch((err) => {
      console.warn("API недоступен, работаем без комментариев:", err.message);
      _commentsData = [];
      render();
    })
    .finally(() => {
      if (_commentsList) {
        _commentsList.classList.remove("loading");
      }
    });
}

export function initHandlers(nameInput, textInput, addButton, commentsList) {
  _nameInput = nameInput;
  _textInput = textInput;
  _addButton = addButton;
  _commentsList = commentsList;

  let formWrapper = _nameInput?.closest(".add-form");
  if (!formWrapper) {
    formWrapper = document.querySelector(".add-form");
  }

  const statusBlock = document.querySelector(".add-form-status");

  _commentsList.classList.add("loading");
  _commentsData = [];
  loadComments();

  addButton.addEventListener('click', () => {
  const name = _nameInput.value.trim();
  const text = _textInput.value.trim();

  if (!name || !text) return;
  if (name.length < 3 || text.length < 3) {
    alert('Имя и комментарий должны быть не короче 3 символов.');
    return;
  }

  _addButton.disabled = true;
  _addButton.classList.add('disabled');

  const apiName = name;
  const apiText = text;

  const savedName = _nameInput.value;
  const savedText = _textInput.value;

  const displayName = escapeHtml(name);
  const displayText = escapeHtml(text);

  _commentsData.push({
    name: displayName,
    text: displayText,
    date: new Date().toLocaleString('ru-RU'),
    likes: 0,
    isLiked: false,
  });
  render();

  if (formWrapper) {
    formWrapper.style.display = 'none';
  }
  if (statusBlock) {
    statusBlock.textContent = 'Комментарий добавляется…';
    statusBlock.style.display = 'block';
  }

addCommentToApi(apiName, apiText)
  .then(() => loadComments())
  .catch((err) => {
    console.error('Ошибка отправки:', err);

    _commentsData.pop();
    render();

    let alertMessage;

    if (err.message === '__400_BAD_REQUEST__') {
      alertMessage = 'Некорректные данные: проверьте имя и текст комментария.';
    } else if (err.message === '__500_INTERNAL_SERVER_ERROR__') {
      alertMessage = 'Сервер сломался, попробуйте позже.';
    } else {
      alertMessage = 'Кажется, у вас пропал интернет, попробуйте позже.';
    }

    alert(alertMessage);
    _nameInput.value = savedName;
    _textInput.value = savedText;

    return Promise.reject(err);
  })
  .finally(() => {
    _addButton.disabled = false;
    _addButton.classList.remove('disabled');

    if (formWrapper) {
      formWrapper.style.display = '';
    }
    if (statusBlock) {
      statusBlock.style.display = 'none';
      statusBlock.textContent = '';
    }
  });
});
}
