/**
 * Auth Service
 * Бизнес-логика для регистрации, логина и работы с токенами
 */

const bcryptjs = require('bcryptjs');
const { User } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

/**
 * Регистрация нового пользователя
 */
const register = async (email, password, firstName, lastName) => {
  // Проверяем, существует ли пользователь
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw {
      status: 409,
      message: 'Пользователь с таким email уже зарегистрирован',
    };
  }

  // Хешируем пароль
  const passwordHash = await bcryptjs.hash(password, 10);

  // Создаём пользователя
  const user = await User.create({
    email,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
  });

  // Генерируем токены
  const accessToken = generateToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: process.env.JWT_EXPIRE || '15m',
    },
  };
};

/**
 * Логин пользователя
 */
const login = async (email, password) => {
  // Ищем пользователя
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw {
      status: 401,
      message: 'Неверный email или пароль',
    };
  }

  // Проверяем пароль
  const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw {
      status: 401,
      message: 'Неверный email или пароль',
    };
  }

  // Генерируем токены
  const accessToken = generateToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: process.env.JWT_EXPIRE || '15m',
    },
  };
};

/**
 * Обновление access token с помощью refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  // Проверяем refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw {
      status: 401,
      message: 'Недействительный или истекший refresh token',
    };
  }

  // Ищем пользователя
  const user = await User.findByPk(decoded.userId);
  if (!user) {
    throw {
      status: 401,
      message: 'Пользователь не найден',
    };
  }

  // Генерируем новый access token
  const newAccessToken = generateToken(user.id, user.email, user.role);

  return {
    access_token: newAccessToken,
    expires_in: process.env.JWT_EXPIRE || '15m',
  };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
};
