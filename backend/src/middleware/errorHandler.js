/**
 * Middleware для обработки ошибок
 * Должен быть последним middleware в цепочке
 */

const errorHandler = (err, req, res, next) => {
  // Обработка ошибок от auth service
  if (err && typeof err === 'object' && err.status) {
    return res.status(err.status).json({
      success: false,
      error: {
        status: err.status,
        message: err.message,
      },
    });
  }

  // Обработка Sequelize ошибок
  if (err && err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: {
        status: 409,
        message: 'Данное значение уже существует в базе данных',
      },
    });
  }

  if (err && err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        status: 400,
        message: err.errors[0].message,
      },
    });
  }

  // Стандартная обработка ошибок
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  console.error(`[ERROR] ${status}: ${message}`, err);

  res.status(status).json({
    success: false,
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * Middleware для обработки 404
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      status: 404,
      message: `Маршрут ${req.method} ${req.path} не найден`,
    },
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
