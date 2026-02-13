-- Green Database Initialization Script
-- This script initializes the green (new production) database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Green database starts empty
-- Schema will be applied by migration framework

-- Print confirmation
DO $$
BEGIN
    RAISE NOTICE 'Green database initialized successfully';
    RAISE NOTICE 'Schema will be applied by migration framework';
END $$;
