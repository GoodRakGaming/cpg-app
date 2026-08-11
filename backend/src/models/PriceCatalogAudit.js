/**
 * Модель PriceCatalogAudit для Sequelize
 * Таблица: price_catalog_audit — журнал правок price_catalog (одна строка на изменение)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PriceCatalogAudit = sequelize.define(
    'PriceCatalogAudit',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      price_catalog_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'price_catalog',
          key: 'id',
        },
      },
      changed_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      changed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      before: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      after: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'price_catalog_audit',
    }
  );

  return PriceCatalogAudit;
};
