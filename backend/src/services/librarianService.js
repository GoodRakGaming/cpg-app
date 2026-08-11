/**
 * Библиотекарь — LLM-категоризация price_catalog при записи.
 * См. docs/PLANNING/PHASE_10_PRICE_CATALOG_PLAN.md, раздел «Библиотекарь: категоризация при записи».
 *
 * Вызывается сервером сразу после ingest (не из n8n — библиотекарю нужен свежий список
 * категорий/канонических имён из БД приложения). Использует тот же локальный Ollama-эндпоинт,
 * что и extraction в n8n, второй отдельный вызов.
 *
 * Fallback на любую ошибку/таймаут вызова LLM: canonical_work_name = source_work_name,
 * category = null (или подсказка из ingest, если была) — не постоянная заглушка, а штатный
 * механизм на случай временной недоступности LXC уже после запуска в проде.
 */

const axios = require('axios');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://192.168.1.106:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || '';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '180000', 10);
// v2 — по итогам тестирования на реальных данных (2026-08-07, 5 раундов, devstral:24b/phi4:14b
// прошли 0/31 ошибок, 0/8 на критичных over-merge кейсах): reasoning-поле первым в схеме +
// ценовой guard rail при канонизации. См. docs/PLANNING/PHASE_10_PRICE_CATALOG_PLAN.md.
const PROMPT_VERSION = 'librarian-v2';

// Порог триграммного сходства, при котором «новая» категория/имя помечается на ревью
// как потенциальный дубль (раунд 1/3 рецензии) — не блокирует, только поднимает флаг.
const TRGM_SIMILARITY_THRESHOLD = 0.35;
// Порог отклонения цены источника от диапазона выбранного существующего канонического варианта,
// при котором совпадение (is_new:false) всё равно помечается на ревью — не блокирует решение
// модели, только поднимает приоритет ручной проверки. Откалибровано по 8 реальным over-merge
// парам с тестирования (2026-08-07): минимальное отклонение среди них — 24.8% («наливной пол»,
// разная толщина заливки). Порог взят заметно ниже (не вплотную к 24.8%), чтобы граничная пара
// не проскакивала мимо защиты из-за погрешности округления цены источника.
const PRICE_GUARD_THRESHOLD = 0.2;
// Ограничение на размер списка, который целиком уходит в промпт (раунд рецензии —
// порог возврата к pgvector зафиксирован на >150 категорий, список категорий не превышает это).
const MAX_CATEGORIES_IN_PROMPT = 200;
const MAX_CANONICAL_NAMES_IN_PROMPT = 300;

// Описания категорий — контекст для более точной категоризации (тестирование 2026-08-07
// показало, что голых имён категорий недостаточно: обе модели-финалистки без описаний путали
// «Умный дом» с «Электромонтажные работы»). ЧЕРНОВИК: описания ниже написаны по собственному
// разбору структуры реального прайса (Альфа Групп), НЕ являются byte-exact копией
// CATEGORY_DESCRIPTIONS из тестового скрипта, которым реально валидировался результат 0/31 —
// точный текст оттуда не был передан. Работает как есть (описание — чистый плюс к контексту,
// не может сделать хуже, чем полное отсутствие описаний), но для точного воспроизведения
// протестированного результата стоит заменить на вербатим-версию от тестировщика.
const CATEGORY_DESCRIPTIONS = {
  'Демонтажные работы': 'демонтаж, резка, устройство проёмов/отверстий, снятие покрытий',
  'Строительные работы': 'кладка, устройство перемычек, изоляция (паро/термо/гидро/звуко), заделка швов',
  'Малярно-штукатурные работы (Потолки)': 'штукатурка и покраска потолков',
  'Малярно-штукатурные работы (Стены)': 'штукатурка и покраска стен',
  'Малярно-штукатурные работы (Откосы, короба, колонны)': 'штукатурка и покраска откосов, коробов, колонн',
  'Разное': 'карнизы (молдинги), декор, окраска — не подошедшее под другие разделы',
  'Столярно-плотницкие работы': 'работы столяра: люки, лючки, экраны радиаторов, обшивка стен, закладные под ГКЛ, инсталляции/ниши',
  'Плиточные работы': 'облицовка плиткой, керамогранитом',
  'Устройство полов': 'стяжка, наливные полы, укладка напольных покрытий',
  'Электромонтажные работы': 'штатная электрика: розетки, выключатели, кабель, щиты, освещение',
  'Электромонтажные работы (Умный дом)': 'системы умного дома: KNX, автоматизация, сценарии, датчики',
  'Вентиляционные работы': 'монтаж систем вентиляции',
  'Сантехнические работы': 'водопровод, канализация, сантехприборы',
  'Работы по монтажу системы отопления': 'радиаторы, трубы отопления, тёплый пол (водяной)',
  'Установка дверей': 'установка дверных полотен (без установки дверных коробок — отдельная категория)',
  'Устройство натяжных потолков': 'монтаж натяжных потолков',
  'Прочие работы': 'вынос мусора, погрузка/разгрузка, перенос мебели, штрабы, нестандартные работы',
  'Земляные работы': 'разработка грунта, копка/засыпка траншей и котлованов, планировка участка',
  'Бетонные работы': 'фундаменты, отмостки, сваи, монолитные конструкции',
};

async function fetchExistingCategories() {
  const rows = await sequelize.query(
    `SELECT DISTINCT category FROM price_catalog
     WHERE category IS NOT NULL AND category != ''
     ORDER BY category LIMIT :limit`,
    { type: QueryTypes.SELECT, replacements: { limit: MAX_CATEGORIES_IN_PROMPT } }
  );
  return rows.map((r) => r.category);
}

// Цены по любому статусу (не только approved) — на этом этапе это ориентир для суждения LLM,
// не итоговая статистика подсказки, отфильтрованная по approved/окну свежести (та считается
// отдельно, см. GET /reference). Инфра-находка (тест over-merge на реальных данных): без цены в
// контексте модель судит только по текстовому сходству названий и рискует слить в одно
// каноническое имя работы с реально разной стоимостью (например, «...1/2 кирпича» и «...1 кирпич»).
async function fetchExistingCanonicalNames(category) {
  const rows = await sequelize.query(
    `SELECT canonical_work_name,
            MIN(price) FILTER (WHERE price_qualifier = 'exact') AS min_price,
            MAX(price) FILTER (WHERE price_qualifier = 'exact') AS max_price
     FROM price_catalog
     WHERE category = :category
     GROUP BY canonical_work_name
     ORDER BY canonical_work_name LIMIT :limit`,
    {
      type: QueryTypes.SELECT,
      replacements: { category, limit: MAX_CANONICAL_NAMES_IN_PROMPT },
    }
  );
  return rows.map((r) => ({
    name: r.canonical_work_name,
    minPrice: r.min_price != null ? Number(r.min_price) : null,
    maxPrice: r.max_price != null ? Number(r.max_price) : null,
  }));
}

function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

// Описание — только контекст для сравнения, не часть значения (та же логика, что и у цены
// в опциях канонизации — см. formatCanonicalOption/valueInstructionNote).
function formatCategoryOption(name) {
  const description = CATEGORY_DESCRIPTIONS[name];
  return description ? `${name} — ${description}` : name;
}

// Форматирует вариант канонического имени вместе с уже известной по нему ценой — так LLM видит
// не только текст, но и факт «это уже дороже/дешевле, чем то, что я категоризирую сейчас».
function formatCanonicalOption({ name, minPrice, maxPrice }) {
  if (minPrice == null) return name;
  const priceLabel = minPrice === maxPrice ? `${formatPrice(minPrice)} ₽` : `${formatPrice(minPrice)}–${formatPrice(maxPrice)} ₽`;
  return `${name} (цена в базе: ${priceLabel})`;
}

function formatSourcePrice(price, priceQualifier) {
  if (priceQualifier === 'on_request' || price == null) return 'по договору (число не указано)';
  const prefix = priceQualifier === 'from' ? 'от ' : priceQualifier === 'approx' ? '≈' : '';
  return `${prefix}${formatPrice(price)} ₽`;
}

// Относительное отклонение цены от диапазона [minPrice, maxPrice] — 0, если цена уже внутри
// диапазона (совпадение бесспорно по цене), иначе доля отклонения от ближайшей границы.
function priceDeltaFraction(price, minPrice, maxPrice) {
  if (price >= minPrice && price <= maxPrice) return 0;
  const nearestBound = price < minPrice ? minPrice : maxPrice;
  return Math.abs(price - nearestBound) / nearestBound;
}

async function findMostSimilar(column, table, value) {
  if (!value) return null;
  const rows = await sequelize.query(
    `SELECT DISTINCT ${column} AS value, similarity(${column}, :value) AS sim
     FROM ${table}
     WHERE ${column} IS NOT NULL AND ${column} != :value
     ORDER BY sim DESC LIMIT 1`,
    { type: QueryTypes.SELECT, replacements: { value } }
  );
  if (rows.length === 0) return null;
  return rows[0].sim >= TRGM_SIMILARITY_THRESHOLD ? rows[0] : null;
}

/**
 * Один constrained-вызов Ollama: даём список опций и просим либо выбрать точное совпадение,
 * либо явно предложить новое значение. Возвращает { value, isNew } или null при любой ошибке.
 *
 * `reasoning` — первое поле схемы, не последнее (находка тестирования, 2026-08-07): при
 * constrained/grammar decoding модель обязана генерировать токены строго по порядку полей
 * схемы. Если первым полем стоит `value`/`is_new`, у модели физически нет места порассуждать
 * до вердикта — критичный over-merge кейс (слияние по цене) проваливали 3 из 4 моделей. Когда
 * `reasoning` идёт первым, модель сначала рассуждает текстом, `value`/`is_new` пишутся уже с
 * оглядкой на это рассуждение — тот же тест ушёл со 100% ошибок до 0%. Само содержимое
 * `reasoning` не используется в коде (не парсится, не сохраняется) — только влияет на порядок
 * генерации.
 */
async function askLibrarian({ instruction, options, sourceValue, extraContext, valueInstructionNote }) {
  if (!OLLAMA_MODEL) return null; // библиотекарь не настроен — сразу fallback, не ошибка

  const schema = {
    type: 'object',
    properties: {
      reasoning: { type: 'string' },
      value: { type: 'string' },
      is_new: { type: 'boolean' },
    },
    required: ['reasoning', 'value', 'is_new'],
  };

  const prompt = [
    instruction,
    '',
    `Существующие варианты (выбери точное совпадение, если оно есть по смыслу):`,
    options.length > 0 ? options.map((o) => `- ${o}`).join('\n') : '(список пока пуст)',
    '',
    `Исходное значение из документа: "${sourceValue}"`,
    extraContext ? `Контекст: ${extraContext}` : '',
    '',
    'Верни JSON: value — выбранный существующий вариант ИЛИ новый предложенный вариант; ' +
      'is_new — true, если value отсутствует в списке существующих вариантов, иначе false.',
    valueInstructionNote || '',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await axios.post(
    `${OLLAMA_URL}/api/generate`,
    {
      model: OLLAMA_MODEL,
      prompt,
      format: schema,
      stream: false,
    },
    { timeout: OLLAMA_TIMEOUT_MS }
  );

  const parsed = JSON.parse(response.data.response);
  if (!parsed || typeof parsed.value !== 'string' || !parsed.value.trim()) return null;
  return { value: parsed.value.trim(), isNew: !!parsed.is_new };
}

/**
 * @param {{source_work_name: string, unit: string, category?: string|null, price?: number|null, price_qualifier?: string}} entry
 * @returns {Promise<{
 *   category: string|null,
 *   canonical_work_name: string,
 *   category_review_flag: boolean,
 *   category_review_details: {category?: {value: string, similarity: number}, canonical_work_name?: {value: string, similarity: number}} | null,
 *   model: string|null,
 *   prompt_version: string|null,
 *   used_fallback: boolean,
 * }>}
 */
async function categorize(entry) {
  const fallback = {
    category: entry.category || null,
    canonical_work_name: entry.source_work_name,
    category_review_flag: false,
    category_review_details: null,
    model: null,
    prompt_version: null,
    used_fallback: true,
  };

  try {
    const existingCategories = await fetchExistingCategories();

    const categoryResult = await askLibrarian({
      instruction: 'Определи каноническую категорию строительной работы для позиции прайс-листа. ' +
        'Категория определяется тем, кто физически выполняет работу (специальность бригады), а не ' +
        'тем, что физически представляет собой объект работы (например, экран радиатора отопления ' +
        'делает столяр, не сантехник — это столярно-плотницкие работы, не отопление).',
      options: existingCategories.map(formatCategoryOption),
      sourceValue: entry.category || entry.source_work_name,
      valueInstructionNote:
        'Если у варианта есть описание через тире — это только подсказка для сравнения, ' +
        'не включай его в value, верни только название категории.',
    });
    if (!categoryResult) return fallback;

    const category = categoryResult.value;
    let categoryReviewFlag = false;
    const reviewDetails = {};
    if (categoryResult.isNew) {
      const similar = await findMostSimilar('category', 'price_catalog', category);
      if (similar) {
        categoryReviewFlag = true;
        reviewDetails.category = { value: similar.value, similarity: Number(similar.sim) };
      }
    }

    const existingNames = await fetchExistingCanonicalNames(category);
    const sourcePriceLabel = formatSourcePrice(entry.price, entry.price_qualifier);

    const nameResult = await askLibrarian({
      instruction:
        'Определи каноническое название работы (для группировки одинаковых по сути работ ' +
        'из разных источников в одну статистику цены).',
      options: existingNames.map(formatCanonicalOption),
      sourceValue: entry.source_work_name,
      extraContext:
        `Категория: ${category}. Единица измерения: ${entry.unit} (контекст, не часть имени). ` +
        `Цена источника: ${sourcePriceLabel}. Если цена сильно отличается от цены существующего варианта ` +
        `в списке — это обычно значит, что это другая по объёму/сложности работа, а не то же самое ` +
        `под другим названием; в таком случае не объединяй их, даже если названия текстуально похожи.`,
      valueInstructionNote:
        'Пометка "(цена в базе: ...)" у вариантов — только подсказка для сравнения, ' +
        'не включай её в value, верни только название работы.',
    });
    if (!nameResult) return fallback;

    if (nameResult.isNew) {
      const similar = await findMostSimilar('canonical_work_name', 'price_catalog', nameResult.value);
      if (similar) {
        categoryReviewFlag = true;
        reviewDetails.canonical_work_name = { value: similar.value, similarity: Number(similar.sim) };
      }
    } else if (entry.price_qualifier === 'exact' && entry.price != null) {
      // Ценовой guard rail (находка тестирования, 2026-08-07): модель может уверенно сказать
      // «это существующая работа» при почти идентичном тексте, но реально другой по объёму/
      // сложности позиции — reasoning-поле выше устранило это на тестовом наборе (0/8), но
      // выборка мала, а цена ошибки высока. Guard не отменяет решение модели, только поднимает
      // приоритет ревью, если цена источника заметно выходит за диапазон выбранного варианта.
      const matched = existingNames.find((n) => n.name === nameResult.value);
      if (matched && matched.minPrice != null) {
        const delta = priceDeltaFraction(entry.price, matched.minPrice, matched.maxPrice);
        if (delta > PRICE_GUARD_THRESHOLD) {
          categoryReviewFlag = true;
          reviewDetails.price_conflict = {
            existing_min: matched.minPrice,
            existing_max: matched.maxPrice,
            source_price: entry.price,
            delta_percent: Math.round(delta * 100),
          };
        }
      }
    }

    return {
      category,
      canonical_work_name: nameResult.value,
      category_review_flag: categoryReviewFlag,
      category_review_details: categoryReviewFlag ? reviewDetails : null,
      model: OLLAMA_MODEL,
      prompt_version: PROMPT_VERSION,
      used_fallback: false,
    };
  } catch (err) {
    console.error('[librarianService] categorize() упал, используется fallback:', err.message);
    return fallback;
  }
}

module.exports = { categorize };
