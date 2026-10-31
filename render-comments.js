export function renderComments(commentsList, commentsData) {
  if (!commentsList) return;
  commentsList.innerHTML = "";

  if (commentsData.length === 0) {
    commentsList.insertAdjacentHTML(
      "beforeend",
      `
      <li class="comment-empty">Комментариев пока нет</li>
    `,
    );
    return;
  }

  function formatDateFromISO(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "—"; // если строка невалидная
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  commentsData.forEach((comment, index) => {
    const likeClass = comment.isLiked
      ? "like-button -active-like"
      : "like-button";
    const dateDisplay = formatDateFromISO(comment.date);
    const nameDisplay = comment.author?.name || "Аноним";

    const commentHTML = `
      <li class="comment" data-index="${index}">
        <div class="comment-header">
          <div>${nameDisplay}</div>
          <div>${dateDisplay}</div>
        </div>
        <div class="comment-body">
          <div class="comment-text">${comment.text}</div>
        </div>
        <div class="comment-footer">
          <div class="likes">
            <span class="likes-counter">${comment.likes}</span>
            <button class="${likeClass}" type="button"></button>
          </div>
        </div>
      </li>
    `;

    commentsList.insertAdjacentHTML("beforeend", commentHTML);
  });
}
