-- Migration to allow NULL values for team2 columns in matches table
-- This enables the new match progression system where winners can wait for opponents

USE table_match_db;

-- Make team2_player1_id nullable to allow matches with only team1
ALTER TABLE matches MODIFY COLUMN team2_player1_id INT NULL;

-- Ensure team2_player2_id is also nullable (it should already be)
ALTER TABLE matches MODIFY COLUMN team2_player2_id INT NULL;

-- Update foreign key constraints to handle NULL values properly
-- (MySQL foreign keys already handle NULL values correctly, so no changes needed)

-- Verify the changes
DESCRIBE matches;