const { Client } = require('pg');

async function fixDatabaseEnums() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'yaya@1984', // Update this with your actual password
    database: 'CityLightPoleDev'
  });

  try {
    console.log('🔧 Connecting to database...');
    await client.connect();

    console.log('📊 Updating enum values...');

    // Update existing RECEIVED records to DELIVERED (use ::text to avoid enum cast errors)
    try {
      const receivedResult = await client.query(`
        UPDATE purchase_requests SET status = 'DELIVERED' WHERE status::text = 'RECEIVED'
      `);
      console.log(`✅ Updated ${receivedResult.rowCount} RECEIVED records to DELIVERED`);
    } catch (err) {
      console.log('⚠️  Purchase RECEIVED update skipped:', err.message);
    }

    // Update existing APPROVED records to AWAITING_DELIVERY for material requests
    try {
      const approvedResult = await client.query(`
        UPDATE material_requests SET status = 'AWAITING_DELIVERY' WHERE status::text = 'APPROVED'
      `);
      console.log(`✅ Updated ${approvedResult.rowCount} APPROVED records to AWAITING_DELIVERY`);
    } catch (err) {
      console.log('⚠️  Material APPROVED update skipped:', err.message);
    }

    // Add missing enum values safely
    console.log('🔄 Adding missing enum values...');

    try {
      await client.query(`ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE IF NOT EXISTS 'READY_TO_DELIVER'`);
      console.log('✅ Added READY_TO_DELIVER to purchase_requests_status_enum');
    } catch (error) {
      console.log('⚠️  READY_TO_DELIVER may already exist or failed to add');
    }

    try {
      await client.query(`ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE IF NOT EXISTS 'COMPLETED'`);
      console.log('✅ Added COMPLETED to purchase_requests_status_enum');
    } catch (error) {
      console.log('⚠️  COMPLETED may already exist or failed to add');
    }

    try {
      await client.query(`ALTER TYPE "public"."material_requests_status_enum" ADD VALUE IF NOT EXISTS 'AWAITING_DELIVERY'`);
      console.log('✅ Added AWAITING_DELIVERY to material_requests_status_enum');
    } catch (error) {
      console.log('⚠️  AWAITING_DELIVERY may already exist or failed to add');
    }

    try {
      await client.query(`ALTER TYPE "public"."material_requests_status_enum" ADD VALUE IF NOT EXISTS 'DELIVERED'`);
      console.log('✅ Added DELIVERED to material_requests_status_enum');
    } catch (error) {
      console.log('⚠️  DELIVERED may already exist or failed to add');
    }

    // Add PARTIALLY_STARTED to maintenance schedules
    try {
      await client.query(`ALTER TYPE "public"."maintenance_schedules_status_enum" ADD VALUE IF NOT EXISTS 'PARTIALLY_STARTED'`);
      console.log('✅ Added PARTIALLY_STARTED to maintenance_schedules_status_enum');
    } catch (error) {
      console.log('⚠️  PARTIALLY_STARTED may already exist or failed to add');
    }

    // Backfill material_requests.code for rows with NULL
    try {
      const nullCodeResult = await client.query(`
        SELECT id FROM material_requests WHERE "code" IS NULL ORDER BY "createdAt" ASC
      `);
      if (nullCodeResult.rows.length > 0) {
        const maxResult = await client.query(`
          SELECT COALESCE(MAX(CAST(SUBSTRING("code" FROM 4) AS INTEGER)), 0) as max_num
          FROM material_requests WHERE "code" LIKE 'MR-%'
        `);
        let nextNum = parseInt(maxResult?.rows?.[0]?.max_num || '0', 10);
        for (const row of nullCodeResult.rows) {
          nextNum += 1;
          const code = `MR-${String(nextNum).padStart(5, '0')}`;
          await client.query(`UPDATE material_requests SET "code" = $1 WHERE id = $2`, [code, row.id]);
        }
        await client.query(`ALTER TABLE material_requests ALTER COLUMN "code" SET NOT NULL`);
        console.log(`✅ Backfilled ${nullCodeResult.rows.length} material request(s) with unique codes`);
      } else {
        console.log('✅ All material_requests already have codes');
      }
    } catch (err) {
      console.log('⚠️  Material request code backfill skipped (column may not exist):', err.message);
    }

    // Verify the changes
    console.log('\n📋 Current enum status counts:');
    const result = await client.query(`
      SELECT 'material_requests' as table_name, status::text as status, COUNT(*) as count
      FROM material_requests
      GROUP BY status
      UNION ALL
      SELECT 'purchase_requests' as table_name, status::text as status, COUNT(*) as count
      FROM purchase_requests
      GROUP BY status
      UNION ALL
      SELECT 'maintenance_schedules' as table_name, status::text as status, COUNT(*) as count
      FROM maintenance_schedules
      GROUP BY status
      ORDER BY table_name, status
    `);

    console.table(result.rows);

    console.log('🎉 Database enum migration completed successfully!');
    console.log('🚀 You can now start your application with: npm run start:dev');

  } catch (error) {
    console.error('❌ Error during database migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabaseEnums();



