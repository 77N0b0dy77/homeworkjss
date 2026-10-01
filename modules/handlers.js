import { createQuotedText, formatDate, escapeHtml } from "./utils.js";
import { renderComments } from "./render-comments.js";

let _nameInput, _textInput, _commentsList, _commentsData;

function attachCommentClicks() {
  const comments = _commentsList.querySelectorAll(".comment");

  comments.forEach(li => {
    li.addEventListener("click", (e) => {
      if (e.target.closest(".like-button")) return;

      const index = parseInt(li.getAttribute("data-index"), 10);
      const comment = _commentsData[index];

      _textInput.value = createQuotedText(comment.name, comment.text);
      _textInput.focus();
    });
  });
}

function attachLikeButtons() {
  const likeButtons = _commentsList.querySelectorAll(".like-button");

  likeButtons.forEach(button => {
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

export function initHandlers(nameInput, textInput, addButton, commentsList, commentsData) {
  _nameInput = nameInput;
  _textInput = textInput;
  _commentsList = commentsList;
  _commentsData = commentsData;

  addButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) return;

    const now = new Date();
    const dateString = formatDate(now);
    const safeName = escapeHtml(name);
    const safeText = escapeHtml(text);

    commentsData.push({
      name: safeName,
      date: dateString,
      text: safeText,
      likes: 0,
      isLiked: false
    });

    render();

    nameInput.value = "";
    textInput.value = "";
  });
}