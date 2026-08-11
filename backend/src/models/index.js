/**
 * Инициализатор моделей
 * Импортирует все модели и устанавливает связи между ними
 */

const sequelize = require('../config/database');
const User = require('./User')(sequelize);
const Template = require('./Template')(sequelize);
const Proposal = require('./Proposal')(sequelize);
const ProposalVersion = require('./ProposalVersion')(sequelize);
const PriceCatalog = require('./PriceCatalog')(sequelize);
const PriceCatalogAudit = require('./PriceCatalogAudit')(sequelize);

// ============= СВЯЗИ МЕЖДУ МОДЕЛЯМИ =============

// User → Templates (один ко многим)
User.hasMany(Template, {
  foreignKey: 'created_by',
  as: 'templates',
});
Template.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

// User → Proposals (один ко многим)
User.hasMany(Proposal, {
  foreignKey: 'user_id',
  as: 'proposals',
});
Proposal.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Template → Proposals (один ко многим)
Template.hasMany(Proposal, {
  foreignKey: 'template_id',
  as: 'proposals',
});
Proposal.belongsTo(Template, {
  foreignKey: 'template_id',
  as: 'template',
});

// Proposal → ProposalVersions (один ко многим)
Proposal.hasMany(ProposalVersion, {
  foreignKey: 'proposal_id',
  as: 'versions',
});
ProposalVersion.belongsTo(Proposal, {
  foreignKey: 'proposal_id',
  as: 'proposal',
});

// User → ProposalVersions (один ко многим) - кто изменил
User.hasMany(ProposalVersion, {
  foreignKey: 'changed_by',
  as: 'changedVersions',
});
ProposalVersion.belongsTo(User, {
  foreignKey: 'changed_by',
  as: 'changedByUser',
});

// Proposal → current ProposalVersion (один к одному)
Proposal.belongsTo(ProposalVersion, {
  foreignKey: 'current_version_id',
  as: 'currentVersion',
  targetKey: 'id',
});

// User → PriceCatalog (кто проверил запись)
User.hasMany(PriceCatalog, {
  foreignKey: 'reviewed_by',
  as: 'reviewedPriceCatalogEntries',
});
PriceCatalog.belongsTo(User, {
  foreignKey: 'reviewed_by',
  as: 'reviewer',
});

// PriceCatalog → PriceCatalogAudit (один ко многим)
PriceCatalog.hasMany(PriceCatalogAudit, {
  foreignKey: 'price_catalog_id',
  as: 'auditLog',
});
PriceCatalogAudit.belongsTo(PriceCatalog, {
  foreignKey: 'price_catalog_id',
  as: 'priceCatalogEntry',
});

User.hasMany(PriceCatalogAudit, {
  foreignKey: 'changed_by',
  as: 'priceCatalogEdits',
});
PriceCatalogAudit.belongsTo(User, {
  foreignKey: 'changed_by',
  as: 'changedByUser',
});

// ============= ЭКСПОРТ =============

module.exports = {
  sequelize,
  User,
  Template,
  Proposal,
  ProposalVersion,
  PriceCatalog,
  PriceCatalogAudit,
};
