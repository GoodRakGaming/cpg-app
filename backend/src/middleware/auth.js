/**
 * JWT Middleware для аутентификации
 * Проверяет наличие и валидность JWT токена в заголовке Authorization
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware для защиты маршрутов
 * Использование: app.use('/api/protected', authenticateToken, routes);
 */
const authenticateToken = (req, res, next) => {
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
    req.userId = decoded.userId;
    req.user = decoded;
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
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
};
