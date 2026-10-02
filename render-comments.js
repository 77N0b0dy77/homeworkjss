export function renderComments(commentsList, commentsData) {
  commentsList.innerHTML = "";

  commentsData.forEach((comment, index) => {
    const likeClass = comment.isLiked ? "like-button -active-like" : "like-button";

    const commentHTML = `
      <li class="comment" data-index="${index}">
        <div class="comment-header">
          <div>${comment.name}</div>
          <div>${comment.date}</div>
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