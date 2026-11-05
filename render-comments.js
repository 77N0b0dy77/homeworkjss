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

export function renderComments(commentsList, commentsData) {
  if (!commentsList) return;
  commentsList.innerHTML = "";

  if (!commentsData || commentsData.length === 0) {
    commentsList.insertAdjacentHTML(
      "beforeend",
      `<li class="comment-empty">Комментариев пока нет</li>`
    );
    return;
  }

  commentsData.forEach((comment, index) => {
    const likeClass = comment.isLiked
      ? "like-button -active-like"
      : "like-button";
    const nameDisplay = comment.author?.name || "Аноним";
    const dateDisplay = formatDateFromISO(comment.date);
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