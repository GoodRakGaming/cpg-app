/**
 * Auth Routes
 * Endpoints для логина, обновления токена, смены пароля
 * Публичной регистрации нет — аккаунты создаёт админ через /api/users (см. routes/users.js)
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { loginSchema, changePasswordSchema } = require('../validators');
const { authenticateToken } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

// Грубая защита от перебора паролей — единственный полностью публичный auth-эндпоинт
// после закрытия регистрации. In-memory (per-процесс) счётчик — при нескольких pm2-воркерах
// фактический лимит кратно выше номинального, это осознанный компромисс для внутренней команды.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      status: 429,
      message: 'Слишком много попыток входа. Попробуйте снова через 15 минут.',
    },
  },
});

/**
 * POST /api/auth/login
 * Логин пользователя
 */
router.post('/login', loginRateLimiter, async (req, res, next) => {
  try {
    // Валидируем входные данные
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: error.details[0].message,
        },
      });
    }

    // Логиним пользователя
    const result = await authService.login(value.email, value.password);

    // Устанавливаем refresh token в httpOnly cookie
    res.cookie('refreshToken', result.tokens.refresh_token, {
      httpOnly: true,
      secure: false, // localhost doesn't support secure cookies
      sameSite: 'lax', // More permissive for localhost development
      path: '/',      // Available on all paths
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    // Also set access token in regular (non-httpOnly) cookie for middleware
    res.cookie('accessToken', result.tokens.access_token, {
      httpOnly: false, // Readable by JavaScript - needed for CORS
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes (same as JWT expiry)
    });

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        access_token: result.tokens.access_token,
        expires_in: result.tokens.expires_in,
      },
      message: 'Успешный вход',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Обновление access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    // Берём refresh token из cookies или body
    const refreshToken = req.cookies.refreshToken || req.body.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: 'Refresh token отсутствует',
        },
      });
    }

    // Обновляем access token
    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Токен успешно обновлён',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Логаут (очистка refresh token)
 */
router.post('/logout', (req, res) => {
  // Очищаем cookie с refresh token
  res.clearCookie('refreshToken');

  return res.status(200).json({
    success: true,
    message: 'Успешный выход',
  });
});

/**
 * POST /api/auth/change-password
 * Смена собственного пароля (любой аутентифицированный пользователь)
 * Не отзывает уже открытые сессии — refresh-токены в проекте stateless.
 */
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: error.details[0].message,
        },
      });
    }

    await authService.changeOwnPassword(req.userId, value.current_password, value.new_password);

    return res.status(200).json({
      success: true,
      message: 'Пароль успешно изменён',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
