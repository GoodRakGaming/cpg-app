/**
 * Auth Routes
 * Endpoints для регистрации, логина и обновления токена
 */

const express = require('express');
const { registerSchema, loginSchema } = require('../validators');
const authService = require('../services/authService');

const router = express.Router();

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
router.post('/register', async (req, res, next) => {
  try {
    // Валидируем входные данные
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: error.details[0].message,
        },
      });
    }

    // Регистрируем пользователя
    const result = await authService.register(
      value.email,
      value.password,
      value.first_name,
      value.last_name
    );

    // Устанавливаем refresh token в httpOnly cookie (как и в login)
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

    return res.status(201).json({
      success: true,
      data: {
        user: result.user,
        access_token: result.tokens.access_token,
        expires_in: result.tokens.expires_in,
      },
      message: 'Пользователь успешно зарегистрирован',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Логин пользователя
 */
router.post('/login', async (req, res, next) => {
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

module.exports = router;
