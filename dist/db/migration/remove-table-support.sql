-- Migration to remove table support and return to single table operation
-- Run this migration after backing up your database

-- Remove table_number column from matches table
ALTER TABLE matches DROP COLUMN table_number;

-- Remove the index that was created for table_number
DROP INDEX IF EXISTS idx_matches_table_number ON matches;

-- Note: The UPDATE statement is removed since we're dropping the column entirely