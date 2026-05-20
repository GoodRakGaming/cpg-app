/**
 * Базовый маршрут для API
 * Здесь будут собираться все маршруты приложения
 */
const express = require('express');
const router = express.Router();

// Health check (временно здесь, потом в основной app)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API работает',
    timestamp: new Date().toISOString(),
  });
});

// TODO: Phase 2 - Auth routes
// router.use('/auth', require('./auth'));

// TODO: Phase 3 - Template routes
// router.use('/templates', require('./templates'));

// TODO: Phase 4 - Proposal routes
// router.use('/proposals', require('./proposals'));

module.exports = router;
