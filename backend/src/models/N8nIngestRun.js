/**
 * Модель N8nIngestRun для Sequelize
 * Таблица: n8n_ingest_runs — см. docs/PLANNING/PHASE_10B_level0_ingestion_plan.md
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const N8nIngestRun = sequelize.define(
    'N8nIngestRun',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      source_filename: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      nextcloud_file_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      resumed_from_run_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'n8n_ingest_runs',
          key: 'id',
        },
      },
      trigger_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      rows_total: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rows_processed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      rows_success: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      rows_failed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failed_rows: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
      },
      error_summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      finished_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: false, // started_at/updated_at/finished_at управляются вручную по модели статусов
      underscored: true,
      tableName: 'n8n_ingest_runs',
    }
  );

  return N8nIngestRun;
};
