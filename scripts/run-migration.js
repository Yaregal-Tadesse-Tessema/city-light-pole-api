const { DataSource } = require('typeorm');
const { FixDamagedComponentsData1767000000001 } = require('../dist/src/migrations/1767000000001-FixDamagedComponentsData');

async function runMigration() {
  // Load environment variables
  require('dotenv').config();

  const configService = {
    get: (key) => process.env[key]
  };

  const databaseUrl = configService.get('DATABASE_URL');
  let dataSourceConfig;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    dataSourceConfig = {
      type: 'postgres',
      host: url.hostname,
      port: parseInt(url.port, 10) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.substring(1), // Remove leading /
      synchronize: false,
      logging: true,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  } else {
    dataSourceConfig = {
      type: 'postgres',
      host: configService.get('DB_HOST', 'localhost'),
      port: parseInt(configService.get('DB_PORT', '5432'), 10),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'yaya@1984'),
      database: configService.get('DB_DATABASE', 'CityLightPoleDev'),
      synchronize: false,
      logging: true,
    };
  }

  const dataSource = new DataSource(dataSourceConfig);

  try {
    await dataSource.initialize();
    console.log('DataSource initialized successfully');

    const migration = new FixDamagedComponentsData1767000000001();
    await migration.up(dataSource.createQueryRunner());
    console.log('Migration completed successfully');

    await dataSource.destroy();
    console.log('DataSource closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();








