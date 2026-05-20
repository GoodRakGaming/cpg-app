require('dotenv').config();
const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'proposals',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    freezeTableName: true,
  },
});

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ PostgreSQL подключение успешно установлено');
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения к PostgreSQL:', err);
  });

module.exports = sequelize;
