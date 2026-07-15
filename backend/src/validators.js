/**
 * Input Validation Schemas
 * Используя Joi для валидации всех входных данных
 */

const Joi = require('joi');

/**
 * Schema для регистрации пользователя
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Некорректный email адрес',
      'any.required': 'Email обязателен',
    }),

  password: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .messages({
      'string.min': 'Пароль должен быть не менее 8 символов',
      'string.pattern.base':
        'Пароль должен содержать заглавные, строчные буквы, цифры и специальные символы',
      'any.required': 'Пароль обязателен',
    }),

  first_name: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Имя не должно превышать 100 символов',
    }),

  last_name: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Фамилия не должна превышать 100 символов',
    }),
}).unknown(false); // Запретить неизвестные поля

/**
 * Schema для логина пользователя
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Некорректный email адрес',
      'any.required': 'Email обязателен',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Пароль обязателен',
    }),
}).unknown(false);

/**
 * Schema для обновления токена
 */
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token обязателен',
    }),
}).unknown(false);

/**
 * Schema для создания шаблона (будет использоваться в Фазе 3)
 */
const templateSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'Название не должно превышать 255 символов',
      'any.required': 'Название шаблона обязательно',
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Описание не должно превышать 1000 символов',
    }),

  version: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.integer': 'Версия должна быть целым числом',
      'number.min': 'Версия должна быть не меньше 1',
    }),

  data: Joi.object()
    .required()
    .messages({
      'any.required': 'Данные шаблона обязательны',
    }),
}).unknown(false);

/**
 * Schema для обновления шаблона
 */
const updateTemplateSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Название не должно превышать 255 символов',
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Описание не должно превышать 1000 символов',
    }),

  data: Joi.object()
    .optional()
    .messages({
      'object.base': 'Данные должны быть объектом',
    }),
}).unknown(false);

/**
 * Schema для создания предложения (будет использоваться в Фазе 4)
 */
const proposalSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'Название не должно превышать 255 символов',
      'any.required': 'Название предложения обязательно',
    }),

  template_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'ID шаблона должен быть валидным UUID',
      'any.required': 'ID шаблона обязателен',
    }),

  status: Joi.string()
    .valid('draft', 'final', 'archived')
    .optional()
    .default('draft')
    .messages({
      'any.only': 'Статус должен быть: draft, final или archived',
    }),

  data: Joi.object()
    .optional()
    .messages({
      'object.base': 'Данные должны быть объектом',
    }),
}).unknown(false);

/**
 * Schema для обновления предложения
 */
const updateProposalSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Название не должно превышать 255 символов',
    }),

  status: Joi.string()
    .valid('draft', 'final', 'archived')
    .optional()
    .messages({
      'any.only': 'Статус должен быть: draft, final или archived',
    }),

  data: Joi.object()
    .optional()
    .messages({
      'object.base': 'Данные должны быть объектом',
    }),

  comment: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Комментарий не должен превышать 500 символов',
    }),
}).unknown(false);

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  templateSchema,
  updateTemplateSchema,
  proposalSchema,
  updateProposalSchema,
};
