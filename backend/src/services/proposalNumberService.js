/**
 * Автонумерация КП — формат "YYYY-NNN" (например "2026-014"), тот же формат, что раньше
 * пользователь вписывал вручную в поле «Номер» (см. docs — поле не новое, просто теперь
 * предзаполняется автоматически, но остаётся редактируемым).
 *
 * Счётчик — одна строка на год в price_catalog-подобной служебной таблице
 * `proposal_number_counters`. Атомарный upsert (ON CONFLICT DO UPDATE ... RETURNING) — безопасно
 * при одновременном создании нескольких КП разными сотрудниками, без отдельной блокировки.
 */

const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function allocateProposalNumber(date = new Date()) {
  const year = date.getFullYear();

  const rows = await sequelize.query(
    `INSERT INTO proposal_number_counters (year, last_number)
     VALUES (:year, 1)
     ON CONFLICT (year) DO UPDATE SET last_number = proposal_number_counters.last_number + 1
     RETURNING last_number`,
    { type: QueryTypes.SELECT, replacements: { year } }
  );

  const lastNumber = rows[0].last_number;
  return `${year}-${String(lastNumber).padStart(3, '0')}`;
}

module.exports = { allocateProposalNumber };
