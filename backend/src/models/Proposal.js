/**
 * Модель Proposal для Sequelize
 * Таблица: proposals
 * Поля: id, title, status, template_id, user_id, current_version_id, is_active, created_at, updated_at
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proposal = sequelize.define(
    'Proposal',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('draft', 'final', 'archived'),
        defaultValue: 'draft',
      },
      template_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'templates',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      current_version_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'proposals',
    }
  );

  return Proposal;
};
