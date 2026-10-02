import { initHandlers } from "./handlers.js";

const nameInput = document.querySelector(".add-form-name");
const textInput = document.querySelector(".add-form-text");
const addButton = document.querySelector(".add-form-button");
const commentsList = document.querySelector(".comments");

if (nameInput && textInput && addButton && commentsList) {
  initHandlers(nameInput, textInput, addButton, commentsList);
}
