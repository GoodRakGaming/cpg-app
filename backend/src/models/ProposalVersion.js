/**
 * Модель ProposalVersion для Sequelize
 * Таблица: proposal_versions
 * Поля: id, proposal_id, version_number, data (JSONB), comment, changed_by, pdf_hash, created_at
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProposalVersion = sequelize.define(
    'ProposalVersion',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      proposal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'proposals',
          key: 'id',
        },
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      comment: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      changed_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      pdf_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'created_at',
      },
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'proposal_versions',
    }
  );

  return ProposalVersion;
};
