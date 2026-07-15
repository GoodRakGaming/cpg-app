require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database');
const { User, Template, Proposal, ProposalVersion } = require('./models');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ============= MIDDLEWARE =============

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cookie Parser (для работы с httpOnly cookies)
app.use(cookieParser());

// ============= ROUTES =============

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend работает',
    timestamp: new Date().toISOString(),
  });
});

// API v1 routes
app.use('/api/auth', require('./routes/auth')); // Фаза 2: Auth endpoints
app.use('/api/templates', require('./routes/templates')); // Фаза 3: Template Management
app.use('/api/proposals', require('./routes/proposals')); // Фаза 4: Proposal CRUD
app.use('/api/pdf', require('./routes/pdf')); // Фаза 5: PDF Generation

// ============= ERROR HANDLING =============

// 404 handler
app.use(notFoundHandler);

// Error handler (должен быть в конце)
app.use(errorHandler);

// ============= DATABASE & SERVER =============

const startServer = async () => {
  try {
    // Проверим подключение к БД
    await sequelize.authenticate();
    console.log('✅ PostgreSQL подключение успешно установлено');

    // Синхронизируем модели с БД (создаём/обновляем таблицы)
    // ВАЖНО: В production используйте миграции вместо sync
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Модели синхронизированы с БД');

    // Запустим сервер
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Сервер запущен на http://0.0.0.0:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${process.env.DATABASE_NAME || 'proposal_generator'}`);
      console.log(`\n📝 API Endpoints:`);
      console.log(`   POST   /api/auth/register      - Регистрация`);
      console.log(`   POST   /api/auth/login         - Вход`);
      console.log(`   POST   /api/auth/refresh       - Обновление токена`);
      console.log(`   POST   /api/auth/logout        - Выход`);
      console.log(`   POST   /api/templates          - Создать шаблон (auth)`);
      console.log(`   GET    /api/templates          - Список шаблонов (auth)`);
      console.log(`   GET    /api/templates/:id      - Получить шаблон (auth)`);
      console.log(`   PUT    /api/templates/:id      - Обновить шаблон (auth)`);
      console.log(`   DELETE /api/templates/:id      - Удалить шаблон (auth)`);
      console.log(`   POST   /api/proposals          - Создать КП (auth)`);
      console.log(`   GET    /api/proposals          - Список КП (auth)`);
      console.log(`   GET    /api/proposals/:id      - Получить КП (auth)`);
      console.log(`   PUT    /api/proposals/:id      - Обновить КП (auth)`);
      console.log(`   DELETE /api/proposals/:id      - Удалить КП (auth)`);
      console.log(`   GET    /api/proposals/:id/versions - История КП (auth)`);
      console.log(`   GET    /api/proposals/:id/versions/:version_id - Версия КП (auth)`);
      console.log(`   POST   /api/pdf/generate/:proposalId - Сгенерировать PDF (auth)`);
      console.log(`   GET    /api/pdf/:proposalId    - Скачать PDF (auth)`);
      console.log(`   POST   /api/pdf/export/:proposalId - Экспортировать PDF (auth)`);
      console.log(`   GET    /api/pdf/status/:proposalId - Статус PDF (auth)`);
      console.log(`   GET    /health                 - Проверка здоровья\n`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  const pdfService = require('./services/pdfService');
  await pdfService.closeBrowser();
  process.exit(0);
});

module.exports = app;
