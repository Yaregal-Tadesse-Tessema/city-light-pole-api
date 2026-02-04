-- Complete fix for enum migration issues
-- Run this BEFORE starting the application

-- 1. Update existing problematic enum values
UPDATE purchase_requests SET status = 'COMPLETED' WHERE status = 'RECEIVED';
UPDATE material_requests SET status = 'AWAITING_DELIVERY' WHERE status = 'APPROVED';

-- 2. Add missing enum values (if they don't exist)
DO $$
BEGIN
    -- Add READY_TO_DELIVER to purchase_requests_status_enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'purchase_requests_status_enum'
        AND e.enumlabel = 'READY_TO_DELIVER'
    ) THEN
        ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE 'READY_TO_DELIVER';
    END IF;

    -- Add COMPLETED to purchase_requests_status_enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'purchase_requests_status_enum'
        AND e.enumlabel = 'COMPLETED'
    ) THEN
        ALTER TYPE "public"."purchase_requests_status_enum" ADD VALUE 'COMPLETED';
    END IF;

    -- Add AWAITING_DELIVERY to material_requests_status_enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'material_requests_status_enum'
        AND e.enumlabel = 'AWAITING_DELIVERY'
    ) THEN
        ALTER TYPE "public"."material_requests_status_enum" ADD VALUE 'AWAITING_DELIVERY';
    END IF;

    -- Add DELIVERED to material_requests_status_enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'material_requests_status_enum'
        AND e.enumlabel = 'DELIVERED'
    ) THEN
        ALTER TYPE "public"."material_requests_status_enum" ADD VALUE 'DELIVERED';
    END IF;
END $$;

-- 3. Verify the changes
SELECT 'material_requests' as table_name, status, COUNT(*) as count
FROM material_requests
GROUP BY status
UNION ALL
SELECT 'purchase_requests' as table_name, status, COUNT(*) as count
FROM purchase_requests
GROUP BY status
ORDER BY table_name, status;



