/**
 * Proposal Routes
 * Endpoints для управления коммерческими предложениями
 * Все endpoints требуют JWT аутентификации
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { proposalSchema, updateProposalSchema } = require('../validators');
const { Proposal, ProposalVersion, Template, User } = require('../models');

const router = express.Router();

/**
 * POST /api/proposals
 * Создание нового коммерческого предложения
 * Требует: JWT auth
 * Body: { title, template_id, status?, data? }
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    // Валидируем входные данные
    const { error, value } = proposalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: error.details[0].message,
        },
      });
    }

    // Проверяем что шаблон существует и принадлежит пользователю или кто-то его создал
    const template = await Template.findOne({
      where: { id: value.template_id, is_active: true },
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

    // Копируем позиции из шаблона как начальные данные предложения
    const initialItems = Array.isArray(template.data?.items) ? template.data.items : [];
    const initialData = { items: initialItems, description: '', ...(value.data || {}) };

    // Создаём предложение
    const proposalId = uuidv4();
    const proposal = await Proposal.create({
      id: proposalId,
      title: value.title,
      status: value.status || 'draft',
      template_id: value.template_id,
      user_id: req.userId,
      current_version_id: null, // Будет обновлено после создания версии
    });

    // Создаём первую версию
    const versionId = uuidv4();
    const pdfHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(initialData))
      .digest('hex');

    const version = await ProposalVersion.create({
      id: versionId,
      proposal_id: proposalId,
      version_number: 1,
      data: initialData,
      comment: 'Начальная версия',
      changed_by: req.userId,
      pdf_hash: pdfHash,
    });

    // Обновляем current_version_id
    proposal.current_version_id = versionId;
    await proposal.save();

    return res.status(201).json({
      success: true,
      data: {
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          template_id: proposal.template_id,
          user_id: proposal.user_id,
          current_version_id: proposal.current_version_id,
          version_number: version.version_number,
          created_at: proposal.createdAt,
          updated_at: proposal.updatedAt,
        },
      },
      message: 'Предложение успешно создано',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proposals
 * Получить список всех активных предложений пользователя
 * Требует: JWT auth
 * Query params: ?limit=10&offset=0&sort=created_at&order=desc&status=draft
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();
    const status = req.query.status; // Опциональный фильтр по статусу

    // Строим где условие
    const where = { user_id: req.userId, is_active: true };
    if (status && ['draft', 'final', 'archived'].includes(status)) {
      where.status = status;
    }

    // Получить предложения пользователя
    const { count, rows } = await Proposal.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sort, order]],
      include: [
        {
          association: 'template',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        proposals: rows.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          template_id: p.template_id,
          template_name: p.template?.name,
          user_id: p.user_id,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        })),
        pagination: {
          total: count,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(count / limit),
        },
        filters: { status: status || 'all' },
      },
      message: `Получено ${count} предложений`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proposals/:id
 * Получить одно предложение с текущей версией
 * Требует: JWT auth
 * Параметры: id (UUID)
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
        is_active: true,
      },
      include: [
        {
          association: 'template',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Предложение не найдено',
        },
      });
    }

    // Получаем текущую версию отдельно если она есть
    let currentVersion = null;
    if (proposal.current_version_id) {
      currentVersion = await ProposalVersion.findOne({
        where: { id: proposal.current_version_id },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          template_id: proposal.template_id,
          template_name: proposal.template?.name,
          user_id: proposal.user_id,
          current_version_id: proposal.current_version_id,
          version_number: currentVersion?.version_number,
          data: currentVersion?.data,
          comment: currentVersion?.comment,
          created_at: proposal.createdAt,
          updated_at: proposal.updatedAt,
        },
      },
      message: 'Предложение найдено',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/proposals/:id
 * Обновить предложение и создать новую версию
 * Требует: JWT auth
 * Параметры: id (UUID)
 * Body: { title?, status?, data?, comment? }
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Валидируем входные данные
    const { error, value } = updateProposalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: error.details[0].message,
        },
      });
    }

    // Находим предложение
    const proposal = await Proposal.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
        is_active: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Предложение не найдено',
        },
      });
    }

    // Получаем текущую версию если она есть
    let currentVersion = null;
    if (proposal.current_version_id) {
      currentVersion = await ProposalVersion.findOne({
        where: { id: proposal.current_version_id },
        attributes: ['version_number', 'data'],
      });
    }

    // Обновляем основные поля предложения
    if (value.title !== undefined) proposal.title = value.title;
    if (value.status !== undefined) proposal.status = value.status;

    // Если есть изменения в данных, создаём новую версию
    let newVersionId = proposal.current_version_id;
    if (value.data !== undefined) {
      // Получаем номер последней версии
      const nextVersionNumber = (currentVersion?.version_number || 0) + 1;

      // Вычисляем PDF hash для кэширования
      const pdfHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(value.data))
        .digest('hex');

      // Создаём новую версию
      const versionId = uuidv4();
      await ProposalVersion.create({
        id: versionId,
        proposal_id: proposal.id,
        version_number: nextVersionNumber,
        data: value.data,
        comment: value.comment || `Версия ${nextVersionNumber}`,
        changed_by: req.userId,
        pdf_hash: pdfHash,
      });

      newVersionId = versionId;
      proposal.current_version_id = versionId;
    }

    await proposal.save();

    return res.status(200).json({
      success: true,
      data: {
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          template_id: proposal.template_id,
          user_id: proposal.user_id,
          current_version_id: proposal.current_version_id,
          updated_at: proposal.updatedAt,
        },
      },
      message: 'Предложение успешно обновлено',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/proposals/:id
 * Удалить предложение (soft delete через is_active)
 * Требует: JWT auth
 * Параметры: id (UUID)
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
        is_active: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Предложение не найдено',
        },
      });
    }

    // Soft delete
    proposal.is_active = false;
    await proposal.save();

    return res.status(200).json({
      success: true,
      data: {
        id: proposal.id,
      },
      message: 'Предложение успешно удалено',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proposals/:id/versions
 * Получить историю версий предложения
 * Требует: JWT auth
 * Параметры: id (UUID)
 */
router.get('/:id/versions', authenticateToken, async (req, res, next) => {
  try {
    // Проверяем что предложение существует и принадлежит пользователю
    const proposal = await Proposal.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
        is_active: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Предложение не найдено',
        },
      });
    }

    // Получаем все версии
    const versions = await ProposalVersion.findAll({
      where: { proposal_id: req.params.id },
      order: [['version_number', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: {
        versions: versions.map((v) => ({
          id: v.id,
          version_number: v.version_number,
          comment: v.comment,
          changed_by: v.changed_by,
          pdf_hash: v.pdf_hash,
          created_at: v.createdAt,
        })),
        total: versions.length,
      },
      message: `Получено ${versions.length} версий`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proposals/:id/versions/:version_id
 * Получить конкретную версию предложения
 * Требует: JWT auth
 */
router.get('/:id/versions/:version_id', authenticateToken, async (req, res, next) => {
  try {
    // Проверяем что предложение принадлежит пользователю
    const proposal = await Proposal.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
        is_active: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Предложение не найдено',
        },
      });
    }

    // Получаем версию
    const version = await ProposalVersion.findOne({
      where: {
        id: req.params.version_id,
        proposal_id: req.params.id,
      },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Версия не найдена',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        version: {
          id: version.id,
          version_number: version.version_number,
          data: version.data,
          comment: version.comment,
          changed_by: version.changed_by,
          pdf_hash: version.pdf_hash,
          created_at: version.createdAt,
        },
      },
      message: 'Версия найдена',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/proposals/:id/versions/:version_id/restore
 * Восстановить предложение до указанной версии
 * Требует: JWT auth
 */
router.post('/:id/versions/:version_id/restore', authenticateToken, async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({
      where: { id: req.params.id, user_id: req.userId, is_active: true },
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: { status: 404, message: 'Предложение не найдено' },
      });
    }

    const version = await ProposalVersion.findOne({
      where: { id: req.params.version_id, proposal_id: req.params.id },
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        error: { status: 404, message: 'Версия не найдена' },
      });
    }

    const lastVersion = await ProposalVersion.findOne({
      where: { proposal_id: req.params.id },
      order: [['version_number', 'DESC']],
    });
    const nextVersionNumber = (lastVersion?.version_number || 0) + 1;
    const pdfHash = crypto.createHash('sha256').update(JSON.stringify(version.data)).digest('hex');

    const newVersionId = uuidv4();
    await ProposalVersion.create({
      id: newVersionId,
      proposal_id: proposal.id,
      version_number: nextVersionNumber,
      data: version.data,
      comment: `Восстановлено из версии ${version.version_number}`,
      changed_by: req.userId,
      pdf_hash: pdfHash,
    });

    proposal.current_version_id = newVersionId;
    await proposal.save();

    return res.status(200).json({
      success: true,
      data: {
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          template_id: proposal.template_id,
          user_id: proposal.user_id,
          current_version_id: proposal.current_version_id,
          data: version.data,
          created_at: proposal.createdAt,
          updated_at: proposal.updatedAt,
        },
      },
      message: `Предложение восстановлено до версии ${version.version_number}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
