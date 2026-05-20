/**
 * Конфигурация для Фазы 2, 3, 4
 * Валидаторы для входящих данных
 */

const joi = require('joi');

// Валидация при регистрации (Фаза 2)
const registerSchema = joi.object({
  email: joi.string().email().required().messages({
    'any.required': 'Email обязателен',
    'string.email': 'Укажите корректный email',
  }),
  password: joi.string().min(6).required().messages({
    'any.required': 'Пароль обязателен',
    'string.min': 'Пароль должен быть минимум 6 символов',
  }),
});

// Валидация при входе (Фаза 2)
const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

// Валидация шаблона (Фаза 3)
const templateSchema = joi.object({
  name: joi.string().required(),
  sections: joi.array().items(joi.object()).required(),
  description: joi.string().optional(),
});

// Валидация КП (Фаза 4)
const proposalSchema = joi.object({
  title: joi.string().required(),
  template_id: joi.string().uuid().required(),
  data: joi.object().required(),
  status: joi.string().valid('draft', 'final', 'archived').default('draft'),
});

module.exports = {
  registerSchema,
  loginSchema,
  templateSchema,
  proposalSchema,
};
