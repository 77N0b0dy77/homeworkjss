
import { initHandlers, handleAddComment } from './handlers.js';

document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.querySelector('.add-form-name');
  const textInput = document.querySelector('.add-form-text');
  const addButton = document.querySelector('.add-form-button');
  const commentsList = document.querySelector('.comments');
  const authPlaceholder = document.getElementById('auth-placeholder');

  if (nameInput && textInput && addButton && commentsList && authPlaceholder) {
    initHandlers(nameInput, textInput, addButton, commentsList, authPlaceholder);

    addButton.addEventListener('click', handleAddComment);
  } else {
    console.warn('Не все элементы найдены. Проверьте классы в HTML.');
  }
});