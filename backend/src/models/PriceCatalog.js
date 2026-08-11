/**
 * Модель PriceCatalog для Sequelize
 * Таблица: price_catalog — см. docs/PLANNING/PHASE_10_PRICE_CATALOG_PLAN.md, раздел «Схема БД»
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PriceCatalog = sequelize.define(
    'PriceCatalog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      source_work_name: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      canonical_work_name: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      price_qualifier: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'exact',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'RUB',
      },
      source_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      source_detail: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      observed_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending_review',
      },
      confidence: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      category_review_flag: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      category_review_details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      prompt_version: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      row_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      raw_extraction: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'price_catalog',
    }
  );

  return PriceCatalog;
};
