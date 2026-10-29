import { initHandlers } from "./handlers.js";
import { handleAddComment } from "./handlers.js"; // Импортируем обработчик

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.querySelector(".add-form-name");
  const textInput = document.querySelector(".add-form-text");
  const addButton = document.querySelector(".add-form-button");
  const commentsList = document.querySelector(".comments");

  if (nameInput && textInput && addButton && commentsList) {
    initHandlers(nameInput, textInput, addButton, commentsList);

    // Вешаем событие на кнопку
    addButton.addEventListener("click", handleAddComment);
  } else {
    console.warn("Не все элементы найдены. Проверьте классы в HTML.");
  }
});
