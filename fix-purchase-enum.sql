-- Fix Purchase Request Status Enum Migration
-- Run this script directly in your PostgreSQL database

-- Step 1: Update existing RECEIVED records to COMPLETED
UPDATE purchase_requests
SET status = 'COMPLETED'
WHERE status = 'RECEIVED';

-- Step 2: Add new enum values (these should already exist from TypeORM sync)
-- ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE IF NOT EXISTS 'READY_TO_DELIVER';
-- ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- If the above ALTER commands fail, you can run them manually:
-- ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE 'READY_TO_DELIVER';
-- ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE 'COMPLETED';

-- Verify the changes
SELECT status, COUNT(*) as count
FROM purchase_requests
GROUP BY status
ORDER BY status;



