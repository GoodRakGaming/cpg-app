/**
 * Auth Service
 * Бизнес-логика для регистрации, логина и работы с токенами
 */

const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

const USER_ATTRIBUTES = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'createdAt', 'updatedAt'];

const toUserDto = (user) => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  role: user.role,
  is_active: user.is_active,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
});

/**
 * Генерирует надёжный временный пароль, гарантированно проходящий парольную
 * политику (заглавные/строчные/цифры/спецсимволы), для выдачи админом сотруднику.
 */
const generateTempPassword = () => {
  const random = crypto.randomBytes(9).toString('base64url'); // ~12 символов, буквы/цифры
  return `Xk9!${random}`;
};

/**
 * Логин пользователя
 */
const login = async (email, password) => {
  // Ищем пользователя (email нормализован в нижний регистр — см. User-модель)
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    throw {
      status: 401,
      message: 'Неверный email или пароль',
    };
  }

  // Проверяем пароль (до проверки is_active — чтобы неверный пароль на деактивированном
  // аккаунте не отличался от неверного пароля на активном)
  const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw {
      status: 401,
      message: 'Неверный email или пароль',
    };
  }

  if (!user.is_active) {
    throw {
      status: 403,
      message: 'Аккаунт деактивирован. Обратитесь к администратору.',
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

  if (!user.is_active) {
    throw {
      status: 403,
      message: 'Аккаунт деактивирован. Обратитесь к администратору.',
    };
  }

  // Генерируем новый access token
  const newAccessToken = generateToken(user.id, user.email, user.role);

  return {
    access_token: newAccessToken,
    expires_in: process.env.JWT_EXPIRE || '15m',
  };
};

/**
 * Создание пользователя админом. Не возвращает токены — админ не должен
 * получать сессию созданного сотрудника.
 */
const createUserByAdmin = async (email, password, firstName, lastName, role = 'user') => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw {
      status: 409,
      message: 'Пользователь с таким email уже зарегистрирован',
    };
  }

  const tempPassword = password || generateTempPassword();
  const passwordHash = await bcryptjs.hash(tempPassword, 10);

  const user = await User.create({
    email: normalizedEmail,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
    role,
  });

  return { user: toUserDto(user), temp_password: tempPassword };
};

/**
 * Смена собственного пароля (любой аутентифицированный пользователь).
 */
const changeOwnPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw { status: 404, message: 'Пользователь не найден' };
  }

  const isValid = await bcryptjs.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Неверный текущий пароль' };
  }

  user.password_hash = await bcryptjs.hash(newPassword, 10);
  await user.save();
};

/**
 * Сброс пароля админом — для пользователя, потерявшего доступ.
 * Не отзывает уже открытые сессии (refresh-токены stateless) — только меняет пароль.
 */
const adminResetPassword = async (userId, password) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw { status: 404, message: 'Пользователь не найден' };
  }

  const tempPassword = password || generateTempPassword();
  user.password_hash = await bcryptjs.hash(tempPassword, 10);
  await user.save();

  return { temp_password: tempPassword };
};

/**
 * Список пользователей (для страницы «Пользователи», admin-only).
 */
const listUsers = async ({ limit, offset, search }) => {
  const where = {};
  if (search) {
    where[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    attributes: USER_ATTRIBUTES,
  });

  return { count, users: rows.map(toUserDto) };
};

/**
 * Один пользователь по id (для проверок вроде «это последний активный админ?»).
 */
const getUserById = async (userId) => {
  const user = await User.findByPk(userId, { attributes: USER_ATTRIBUTES });
  return user ? toUserDto(user) : null;
};

/**
 * Обновление is_active/role пользователя (admin-only). Защита от удаления
 * последнего активного админа — на уровне роута (там же, где известен req.userId).
 */
const updateUser = async (userId, updates) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw { status: 404, message: 'Пользователь не найден' };
  }

  if (updates.is_active !== undefined) user.is_active = updates.is_active;
  if (updates.role !== undefined) user.role = updates.role;
  await user.save();

  return toUserDto(user);
};

/**
 * Количество активных администраторов — используется, чтобы не остаться без единого админа.
 */
const countActiveAdmins = () => User.count({ where: { role: 'admin', is_active: true } });

module.exports = {
  login,
  refreshAccessToken,
  createUserByAdmin,
  changeOwnPassword,
  adminResetPassword,
  listUsers,
  getUserById,
  updateUser,
  countActiveAdmins,
  toUserDto,
};
