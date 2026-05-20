/**
 * Скрипт для исправления структуры таблиц БД
 * Пересоздает таблицы с правильной структурой
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Используем существующий конфиг БД
const sequelize = require('./src/config/database');

async function fixDatabase() {
  try {
    console.log('🔧 Подключение к БД...');
    await sequelize.authenticate();
    console.log('✅ Подключено к БД');

    // Инициализируем модели (это загружает src/models/index.js)
    console.log('📦 Инициализация моделей...');
    require('./src/models');

    // Alter sync - обновляет существующие таблицы
    console.log('🔄 Синхронизация таблиц (alter: true)...');
    await sequelize.sync({ alter: true });

    console.log('✅ Таблицы успешно синхронизированы!');

    // Проверим структуру таблицы proposals
    console.log('\n📊 Проверка структуры таблицы proposals:');
    const describeResult = await sequelize.getQueryInterface().describeTable('proposals');
    console.log('Колонки:', Object.keys(describeResult).sort());

    await sequelize.close();
    console.log('✅ Готово!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDatabase();
