/**
 * Скрипт инициализации БД с демо-данными
 * Создает тестового пользователя и примеры шаблонов/предложений
 * 
 * Использование: node setup-demo-data.js
 */

require('dotenv').config();
const sequelize = require('./src/config/database');
const { User, Template, Proposal, ProposalVersion } = require('./src/models');
const bcryptjs = require('bcryptjs');

const setupDemoData = async () => {
  try {
    console.log('📝 Инициализация БД с демо-данными...\n');

    // Синхронизируем БД
    await sequelize.sync({ force: false });
    console.log('✅ Таблицы синхронизированы\n');

    // Проверяем, существует ли демо-пользователь
    let demoUser = await User.findOne({ where: { email: 'test@example.com' } });

    if (demoUser) {
      console.log('⚠️  Демо-пользователь уже существует');
      console.log(`   📧 Email: test@example.com`);
      console.log(`   🔐 Password: Test123!\n`);
    } else {
      // Хешируем пароль
      const hashedPassword = await bcryptjs.hash('Test123!', 10);

      // Создаем демо-пользователя
      demoUser = await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
      });

      console.log('✅ Демо-пользователь создан');
      console.log(`   📧 Email: test@example.com`);
      console.log(`   🔐 Password: Test123!`);
      console.log(`   👤 Name: Test User\n`);
    }

    // Создаем демо-шаблоны
    let demoTemplate = await Template.findOne({ where: { created_by: demoUser.id } });

    if (demoTemplate) {
      console.log('⚠️  Демо-шаблон уже существует');
    } else {
      demoTemplate = await Template.create({
        name: 'Стандартный шаблон',
        description: 'Базовый шаблон для коммерческих предложений',
        created_by: demoUser.id,
        content: JSON.stringify({
          header: {
            company: 'Компания',
            logo: '',
            color: '#2563EB',
          },
          sections: [
            {
              title: 'Описание услуг',
              items: [],
            },
            {
              title: 'Стоимость',
              items: [],
            },
            {
              title: 'Условия и сроки',
              items: [],
            },
          ],
        }),
      });

      console.log('✅ Демо-шаблон создан');
      console.log(`   📋 Name: ${demoTemplate.name}\n`);
    }

    // Создаем демо-предложение
    let demoProposal = await Proposal.findOne({ where: { created_by: demoUser.id } });

    if (demoProposal) {
      console.log('⚠️  Демо-предложение уже существует');
    } else {
      demoProposal = await Proposal.create({
        title: 'Пример коммерческого предложения',
        template_id: demoTemplate.id,
        created_by: demoUser.id,
        status: 'draft',
        data: JSON.stringify({
          items: [
            {
              description: 'Консультация',
              quantity: 1,
              price: 10000,
            },
            {
              description: 'Реализация',
              quantity: 1,
              price: 50000,
            },
          ],
          total: 60000,
        }),
        pdf_hash: null,
      });

      console.log('✅ Демо-предложение создано');
      console.log(`   📄 Title: ${demoProposal.title}`);
      console.log(`   📊 Status: ${demoProposal.status}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Демо-данные готовы!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🌐 Откройте браузер: http://localhost:3001');
    console.log('\n📝 Тестовые учетные данные:');
    console.log('   Email:    test@example.com');
    console.log('   Password: Test123!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при инициализации БД:');
    console.error(error.message);
    console.error('\n💡 Убедитесь, что:');
    console.error('   1. PostgreSQL запущена');
    console.error('   2. База данных proposal_generator создана');
    console.error('   3. .env файл правильно сконфигурирован\n');
    process.exit(1);
  }
};

// Запускаем
setupDemoData();
