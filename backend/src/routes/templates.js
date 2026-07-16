/**
 * Template Routes
 * Endpoints для управления шаблонами коммерческих предложений
 * Все endpoints требуют JWT аутентификации
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { templateSchema, updateTemplateSchema } = require('../validators');
const { Template, User } = require('../models');

const router = express.Router();

/**
 * POST /api/templates
 * Создание нового шаблона
 * Требует: JWT auth
 * Body: { name, description?, version?, data }
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    // Валидируем входные данные
    const { error, value } = templateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: error.details[0].message,
        },
      });
    }

    // Создаём шаблон
    const template = await Template.create({
      id: uuidv4(),
      name: value.name,
      description: value.description || null,
      version: value.version || 1,
      data: value.data,
      created_by: req.userId, // Из middleware authenticateToken
      is_active: true,
    });

    return res.status(201).json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          version: template.version,
          data: template.data,
          created_by: template.created_by,
          is_active: template.is_active,
          created_at: template.createdAt,
          updated_at: template.updatedAt,
        },
      },
      message: 'Шаблон успешно создан',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/templates
 * Получить список всех активных шаблонов пользователя
 * Требует: JWT auth
 * Query params: ?limit=10&offset=0&sort=created_at&order=desc&search=текст
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 per page
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();
    const search = req.query.search; // Опциональный поиск по названию

    // Строим где условие
    const where = {
      created_by: req.userId,
      is_active: true,
    };
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    // Получить шаблоны пользователя
    const { count, rows } = await Template.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sort, order]],
      attributes: [
        'id',
        'name',
        'description',
        'version',
        'data',
        'created_by',
        'is_active',
        'createdAt',
        'updatedAt',
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        templates: rows.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          version: t.version,
          data: t.data,
          created_by: t.created_by,
          is_active: t.is_active,
          created_at: t.createdAt,
          updated_at: t.updatedAt,
        })),
        pagination: {
          total: count,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(count / limit),
        },
      },
      message: `Получено ${count} шаблонов`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/templates/:id
 * Получить один шаблон по ID
 * Требует: JWT auth
 * Параметры: id (UUID)
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        created_by: req.userId, // Только свои шаблоны
        is_active: true,
      },
      attributes: [
        'id',
        'name',
        'description',
        'version',
        'data',
        'created_by',
        'is_active',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Шаблон не найден',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          version: template.version,
          data: template.data,
          created_by: template.created_by,
          is_active: template.is_active,
          created_at: template.createdAt,
          updated_at: template.updatedAt,
        },
      },
      message: 'Шаблон найден',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/templates/:id
 * Обновить шаблон
 * Требует: JWT auth
 * Параметры: id (UUID)
 * Body: { name?, description?, data? }
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Валидируем входные данные
    const { error, value } = updateTemplateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: error.details[0].message,
        },
      });
    }

    // Находим шаблон
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        created_by: req.userId, // Только свои шаблоны
        is_active: true,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Шаблон не найден',
        },
      });
    }

    // Обновляем шаблон
    if (value.name !== undefined) template.name = value.name;
    if (value.description !== undefined) template.description = value.description;
    if (value.data !== undefined) template.data = value.data;

    await template.save();

    return res.status(200).json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          version: template.version,
          data: template.data,
          created_by: template.created_by,
          is_active: template.is_active,
          created_at: template.createdAt,
          updated_at: template.updatedAt,
        },
      },
      message: 'Шаблон успешно обновлён',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/templates/:id
 * Удалить шаблон (soft delete через is_active)
 * Требует: JWT auth
 * Параметры: id (UUID)
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        created_by: req.userId, // Только свои шаблоны
        is_active: true,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Шаблон не найден',
        },
      });
    }

    // Soft delete - отмечаем как неактивный
    template.is_active = false;
    await template.save();

    return res.status(200).json({
      success: true,
      data: {
        id: template.id,
      },
      message: 'Шаблон успешно удалён',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
