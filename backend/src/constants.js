/**
 * Константы приложения
 */

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  FINAL: 'final',
  ARCHIVED: 'archived',
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

const MESSAGES = {
  // Success
  SUCCESS: 'Успешно',
  CREATED: 'Создано успешно',
  UPDATED: 'Обновлено успешно',
  DELETED: 'Удалено успешно',
  
  // Errors
  UNAUTHORIZED: 'Требуется аутентификация',
  FORBIDDEN: 'Доступ запрещён',
  NOT_FOUND: 'Ресурс не найден',
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  EMAIL_ALREADY_EXISTS: 'Email уже зарегистрирован',
  INTERNAL_ERROR: 'Внутренняя ошибка сервера',
};

module.exports = {
  HTTP_STATUS,
  PROPOSAL_STATUS,
  USER_ROLES,
  MESSAGES,
};
