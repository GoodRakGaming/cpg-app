/**
 * User Management Routes (admin-only)
 * Страница «Пользователи» в дашборде — создание/список/деактивация/сброс пароля
 * Все endpoints требуют JWT аутентификации + роль admin
 */

const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { createUserSchema, updateUserSchema, resetPasswordSchema } = require('../validators');
const authService = require('../services/authService');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

/**
 * GET /api/users
 * Список пользователей
 * Query params: ?limit=10&offset=0&search=текст
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;

    const { count, users } = await authService.listUsers({ limit, offset, search });

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(count / limit),
        },
      },
      message: `Получено ${count} пользователей`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Создать пользователя. Если password не передан — сервер генерирует временный пароль
 * и возвращает его один раз в ответе.
 */
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: error.details[0].message },
      });
    }

    const result = await authService.createUserByAdmin(
      value.email,
      value.password,
      value.first_name,
      value.last_name,
      value.role
    );

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Пользователь создан',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/:id
 * Обновить is_active/role. Защита: нельзя деактивировать/разжаловать последнего активного админа.
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: error.details[0].message },
      });
    }

    const removesAdminAccess = value.role === 'user' || value.is_active === false;
    if (removesAdminAccess) {
      const target = await authService.getUserById(req.params.id);
      const targetIsActiveAdmin = target && target.role === 'admin' && target.is_active;
      if (targetIsActiveAdmin) {
        const activeAdmins = await authService.countActiveAdmins();
        if (activeAdmins <= 1) {
          return res.status(400).json({
            success: false,
            error: { status: 400, message: 'Нельзя убрать последнего администратора' },
          });
        }
      }
    }

    const user = await authService.updateUser(req.params.id, value);

    return res.status(200).json({
      success: true,
      data: { user },
      message: 'Пользователь обновлён',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users/:id/reset-password
 * Сгенерировать новый временный пароль для пользователя, потерявшего доступ.
 */
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: error.details[0].message },
      });
    }

    const result = await authService.adminResetPassword(req.params.id, value.password);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Пароль сброшен',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
