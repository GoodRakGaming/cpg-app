/**
 * Price Catalog Routes — Phase 10, app-side фундамент
 * См. docs/PLANNING/PHASE_10_PRICE_CATALOG_PLAN.md, раздел «API»
 */

const express = require('express');
const crypto = require('crypto');
const { Op, QueryTypes } = require('sequelize');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  ingestPriceCatalogSchema,
  updatePriceCatalogSchema,
  renameCanonicalSchema,
  sendGroupToReviewSchema,
} = require('../validators');
const { PriceCatalog, PriceCatalogAudit, sequelize } = require('../models');
const librarianService = require('../services/librarianService');

const router = express.Router();

const AUDITABLE_FIELDS = [
  'status',
  'source_work_name',
  'canonical_work_name',
  'category',
  'unit',
  'price',
  'price_qualifier',
  'currency',
  'source_type',
  'source_detail',
];

const CONFIDENCE_ORDER = "CASE confidence WHEN 'low' THEN 0 WHEN 'medium' THEN 1 WHEN 'high' THEN 2 ELSE 3 END";

/**
 * Ingest использует отдельный API-ключ (не JWT) — вызывающая сторона это n8n, не залогиненный
 * сотрудник. Ключ живёт в backend .env / n8n credentials, не в теле workflow (раунд 2 рецензии).
 */
function requireIngestApiKey(req, res, next) {
  const expected = process.env.PRICE_CATALOG_INGEST_KEY;
  const provided = req.headers['x-api-key'];
  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({
      success: false,
      error: { status: 401, message: 'Недействительный или отсутствующий API-ключ' },
    });
  }
  next();
}

function computeRowHash({ source_detail, source_work_name, unit, price }) {
  const normalized = [
    (source_detail || '').trim().toLowerCase(),
    source_work_name.trim().toLowerCase(),
    unit.trim().toLowerCase(),
    price == null ? 'null' : Number(price).toFixed(2),
  ].join('|');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function serialize(entry) {
  return {
    id: entry.id,
    source_work_name: entry.source_work_name,
    canonical_work_name: entry.canonical_work_name,
    category: entry.category,
    unit: entry.unit,
    price: entry.price,
    price_qualifier: entry.price_qualifier,
    currency: entry.currency,
    source_type: entry.source_type,
    source_detail: entry.source_detail,
    observed_date: entry.observed_date,
    status: entry.status,
    confidence: entry.confidence,
    category_review_flag: entry.category_review_flag,
    category_review_details: entry.category_review_details,
    model: entry.model,
    prompt_version: entry.prompt_version,
    raw_extraction: entry.raw_extraction,
    reviewed_by: entry.reviewed_by,
    reviewed_at: entry.reviewed_at,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

/**
 * POST /api/price-catalog/ingest
 * Приём извлечённых данных от n8n. Считает row_hash сам, при коллизии обновляет observed_date
 * вместо отклонения (раунд 2 — см. «Конфликт окна свежести с дедупликацией по хешу»), иначе
 * создаёт новую запись и вызывает Библиотекаря (fallback при недоступности LLM — см. сервис).
 */
router.post('/ingest', requireIngestApiKey, async (req, res, next) => {
  try {
    const { error, value } = ingestPriceCatalogSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: error.details[0].message },
      });
    }

    const rowHash = computeRowHash(value);

    const existing = await PriceCatalog.findOne({ where: { row_hash: rowHash } });
    const observedDate = value.observed_date
      ? new Date(value.observed_date)
      : new Date();
    const dateSource = value.observed_date ? 'extracted' : 'upload_fallback';

    if (existing) {
      if (observedDate > new Date(existing.observed_date)) {
        existing.observed_date = observedDate;
        await existing.save();
      }
      return res.status(200).json({
        success: true,
        data: { price_catalog: serialize(existing), deduplicated: true },
        message: 'Запись с такими данными уже существует — обновлена дата наблюдения',
      });
    }

    const created = await PriceCatalog.create({
      source_work_name: value.source_work_name,
      canonical_work_name: value.source_work_name, // временно, библиотекарь переопределит ниже
      category: value.category || null,
      unit: value.unit,
      price: value.price,
      price_qualifier: value.price_qualifier,
      currency: value.currency,
      source_type: value.source_type,
      source_detail: value.source_detail || null,
      observed_date: observedDate,
      status: 'pending_review',
      confidence: value.confidence || null,
      model: value.model || null,
      prompt_version: value.prompt_version || null,
      row_hash: rowHash,
      raw_extraction: {
        ...(value.raw_extraction || {}),
        date_source: dateSource,
      },
    });

    const librarianResult = await librarianService.categorize({
      source_work_name: value.source_work_name,
      unit: value.unit,
      category: value.category,
      price: value.price,
      price_qualifier: value.price_qualifier,
    });

    created.category = librarianResult.category;
    created.canonical_work_name = librarianResult.canonical_work_name;
    created.category_review_flag = librarianResult.category_review_flag;
    created.category_review_details = librarianResult.category_review_details;
    // Библиотекарь пишет свою модель/версию промпта поверх extraction-полей — это отдельный
    // вызов LLM, аудит происхождения категоризации важнее, чем происхождения самого извлечения,
    // раз extraction модель/версия уже сохранены в raw_extraction на шаге выше при желании.
    if (!librarianResult.used_fallback) {
      created.model = librarianResult.model;
      created.prompt_version = librarianResult.prompt_version;
    }
    await created.save();

    return res.status(201).json({
      success: true,
      data: { price_catalog: serialize(created), deduplicated: false },
      message: 'Запись создана и передана на проверку',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/price-catalog?status=&search=&category_review_flag=&limit=&offset=
 * Очередь проверки — доступна любому сотруднику (см. «Зафиксированные решения»).
 * Сортировка по умолчанию: confidence (сначала low), затем самые новые сверху.
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || 'pending_review';
    const search = req.query.search;

    const where = {};
    if (status !== 'all') where.status = status;
    if (req.query.category_review_flag === 'true') where.category_review_flag = true;
    if (search) {
      where[Op.or] = [
        { source_work_name: { [Op.iLike]: `%${search}%` } },
        { canonical_work_name: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await PriceCatalog.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        [sequelize.literal(CONFIDENCE_ORDER), 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        price_catalog: rows.map(serialize),
        pagination: {
          total: count,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(count / limit),
        },
      },
      message: `Получено ${count} записей`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/price-catalog/reference?search=&limit=&offset=
 * Страница «Справочник» — обзор уже одобренного каталога, сгруппированный по
 * (canonical_work_name, unit, category), с диапазоном цены. Видна всем сотрудникам (просмотр).
 */
router.get('/reference', authenticateToken, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;

    const searchClause = search ? 'AND canonical_work_name ILIKE :search' : '';
    const replacements = { limit, offset, search: `%${search || ''}%` };

    const groups = await sequelize.query(
      `SELECT
         canonical_work_name,
         unit,
         MAX(category) AS category,
         COUNT(*) FILTER (WHERE price_qualifier = 'exact') AS exact_count,
         MIN(price) FILTER (WHERE price_qualifier = 'exact') AS min_price,
         MAX(price) FILTER (WHERE price_qualifier = 'exact') AS max_price,
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) FILTER (WHERE price_qualifier = 'exact') AS median_price,
         COUNT(*) FILTER (WHERE price_qualifier IN ('from', 'approx')) AS from_approx_count,
         MIN(price) FILTER (WHERE price_qualifier IN ('from', 'approx')) AS from_approx_min_price,
         COUNT(*) FILTER (WHERE price_qualifier = 'on_request') AS on_request_count
       FROM price_catalog
       WHERE status = 'approved' AND observed_date >= now() - interval '12 months' ${searchClause}
       GROUP BY canonical_work_name, unit
       ORDER BY canonical_work_name
       LIMIT :limit OFFSET :offset`,
      { type: QueryTypes.SELECT, replacements }
    );

    const [{ count }] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM (
         SELECT canonical_work_name, unit FROM price_catalog
         WHERE status = 'approved' AND observed_date >= now() - interval '12 months' ${searchClause}
         GROUP BY canonical_work_name, unit
       ) g`,
      { type: QueryTypes.SELECT, replacements }
    );

    return res.status(200).json({
      success: true,
      data: {
        groups: groups.map((g) => ({
          canonical_work_name: g.canonical_work_name,
          unit: g.unit,
          category: g.category,
          min_price: g.min_price,
          max_price: g.max_price,
          median_price: g.median_price,
          source_count: parseInt(g.exact_count, 10),
          from_approx_count: parseInt(g.from_approx_count, 10),
          from_approx_min_price: g.from_approx_min_price,
          on_request_count: parseInt(g.on_request_count, 10),
        })),
        pagination: {
          total: parseInt(count, 10),
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(parseInt(count, 10) / limit),
        },
      },
      message: `Получено ${groups.length} позиций справочника`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/price-catalog/reference/sources?canonical_work_name=&unit=
 * Список одобренных записей, из которых складывается диапазон конкретной группы в «Справочнике»
 * (те же записи и то же окно свежести, что и агрегация выше) — доступно всем сотрудникам.
 */
router.get('/reference/sources', authenticateToken, async (req, res, next) => {
  try {
    const { canonical_work_name: canonicalWorkName, unit } = req.query;
    if (!canonicalWorkName || !unit) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: 'canonical_work_name и unit обязательны' },
      });
    }

    const sources = await PriceCatalog.findAll({
      where: {
        canonical_work_name: canonicalWorkName,
        unit,
        status: 'approved',
      },
      order: [['observed_date', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: { sources: sources.map(serialize) },
      message: `Найдено источников: ${sources.length}`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/price-catalog/:id
 * Одобрение/отклонение/точечная правка. Правка уже одобренной записи — только admin
 * (см. «Страница «Справочник»» — разграничение прав); проверка pending_review — любой сотрудник.
 * Возврат отклонённой записи на пересмотр (rejected -> pending_review) — тоже только admin
 * (второй раунд правок: обычное ревью открыто всем, но переоткрытие уже отклонённого/принятого
 * решения — более чувствительное действие). Каждый вызов пишет строку в price_catalog_audit до
 * применения изменения. row_hash не трогаем.
 */
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await PriceCatalog.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: { status: 404, message: 'Запись не найдена' },
      });
    }

    const isReopeningRejected = entry.status === 'rejected' && req.body.status === 'pending_review';
    const requiresAdmin = entry.status === 'approved' || isReopeningRejected;

    if (requiresAdmin && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          status: 403,
          message: 'Это действие доступно только администратору',
        },
      });
    }

    const { error, value } = updatePriceCatalogSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: error.details[0].message },
      });
    }

    const before = {};
    const after = {};
    for (const field of AUDITABLE_FIELDS) {
      if (value[field] !== undefined && value[field] !== entry[field]) {
        before[field] = entry[field];
        after[field] = value[field];
      }
    }

    if (Object.keys(after).length === 0) {
      return res.status(200).json({
        success: true,
        data: { price_catalog: serialize(entry) },
        message: 'Изменений нет',
      });
    }

    await sequelize.transaction(async (t) => {
      await PriceCatalogAudit.create(
        {
          price_catalog_id: entry.id,
          changed_by: req.userId,
          before,
          after,
        },
        { transaction: t }
      );

      Object.assign(entry, after);
      if (after.status && after.status !== 'pending_review') {
        entry.reviewed_by = req.userId;
        entry.reviewed_at = new Date();
      }
      await entry.save({ transaction: t });
    });

    return res.status(200).json({
      success: true,
      data: { price_catalog: serialize(entry) },
      message: 'Запись обновлена',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/price-catalog/rename-canonical
 * Bulk-переименование (merge двух групп) — только admin. Одна строка аудита на каждую
 * переименованную запись, вся операция в одной транзакции (раунд 2/3 рецензии).
 */
router.post('/rename-canonical', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = renameCanonicalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: error.details[0].message },
      });
    }

    const { from_canonical_work_name, unit, to_canonical_work_name } = value;

    const result = await sequelize.transaction(async (t) => {
      const matches = await PriceCatalog.findAll({
        where: { canonical_work_name: from_canonical_work_name, unit },
        transaction: t,
      });

      if (matches.length === 0) {
        return { count: 0 };
      }

      for (const entry of matches) {
        await PriceCatalogAudit.create(
          {
            price_catalog_id: entry.id,
            changed_by: req.userId,
            before: { canonical_work_name: from_canonical_work_name },
            after: { canonical_work_name: to_canonical_work_name },
          },
          { transaction: t }
        );
        entry.canonical_work_name = to_canonical_work_name;
        await entry.save({ transaction: t });
      }

      return { count: matches.length };
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        error: { status: 404, message: 'Записи с указанным canonical_work_name/unit не найдены' },
      });
    }

    return res.status(200).json({
      success: true,
      data: { renamed_count: result.count },
      message: `Переименовано записей: ${result.count}`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/price-catalog/send-to-review
 * Вернуть на пересмотр все одобренные записи группы (canonical_work_name, unit) — только admin
 * (второй раунд правок). Со страницы «Справочник» отдельных id записей не видно — группа
 * агрегированная, поэтому это bulk-операция, как и rename-canonical. Одна строка аудита на
 * запись, вся операция в одной транзакции.
 */
router.post('/send-to-review', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = sendGroupToReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: error.details[0].message },
      });
    }

    const { canonical_work_name: canonicalWorkName, unit } = value;

    const result = await sequelize.transaction(async (t) => {
      const matches = await PriceCatalog.findAll({
        where: { canonical_work_name: canonicalWorkName, unit, status: 'approved' },
        transaction: t,
      });

      for (const entry of matches) {
        await PriceCatalogAudit.create(
          {
            price_catalog_id: entry.id,
            changed_by: req.userId,
            before: { status: 'approved' },
            after: { status: 'pending_review' },
          },
          { transaction: t }
        );
        entry.status = 'pending_review';
        await entry.save({ transaction: t });
      }

      return { count: matches.length };
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        error: { status: 404, message: 'Одобренные записи с указанным canonical_work_name/unit не найдены' },
      });
    }

    return res.status(200).json({
      success: true,
      data: { sent_to_review_count: result.count },
      message: `Отправлено на пересмотр записей: ${result.count}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
