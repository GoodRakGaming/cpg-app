/**
 * JWT Middleware для аутентификации
 * Проверяет наличие и валидность JWT токена в заголовке Authorization
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware для защиты маршрутов
 * Использование: app.use('/api/protected', authenticateToken, routes);
 *
 * Дополнительно подгружает свежие role/is_active из БД на каждый запрос — refresh-токены
 * в этом проекте полностью stateless, так что это единственный способ мгновенно отозвать
 * доступ у деактивированного пользователя без ожидания истечения access-токена.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        status: 401,
        message: 'Требуется аутентификация. Укажите токен в заголовке Authorization: Bearer <token>',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId, { attributes: ['id', 'role', 'is_active'] });
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          status: 401,
          message: 'Аккаунт деактивирован или не найден',
        },
      });
    }

    req.userId = user.id;
    req.user = { userId: user.id, email: decoded.email, role: user.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          status: 401,
          message: 'Токен истёк. Используйте refresh token для обновления.',
        },
      });
    }

    return res.status(403).json({
      success: false,
      error: {
        status: 403,
        message: 'Недействительный токен',
      },
    });
  }
};

/**
 * Middleware для эндпоинтов, требующих роль admin.
 * Должен идти в цепочке ПОСЛЕ authenticateToken.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        status: 403,
        message: 'Требуются права администратора',
      },
    });
  }
  next();
};

/**
 * Генерирует JWT токен
 */
const generateToken = (userId, email, role = 'user') => {
  return jwt.sign(
    {
      userId,
      email,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '15m',
    }
  );
};

/**
 * Генерирует refresh токен (долгоживущий)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    }
  );
};

/**
 * Проверяет валидность refresh токена
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
};
