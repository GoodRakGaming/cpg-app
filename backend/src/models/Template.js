/**
 * Модель Template для Sequelize
 * Таблица: templates
 * Поля: id, name, description, version, data (JSONB), created_by, is_active, created_at, updated_at
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Template = sequelize.define(
    'Template',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: { sections: [] },
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'templates',
    }
  );

  return Template;
};
