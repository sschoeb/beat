-- Migration: Add support for multiple tables/courts
-- This adds a table_number field to matches to track which table/court the match is played on

USE table_match_db;

-- Add table_number column to matches table
ALTER TABLE matches ADD COLUMN table_number INT DEFAULT 1 NOT NULL AFTER id;

-- Create index for faster queries on table_number
CREATE INDEX idx_matches_table_number ON matches(table_number);

-- Create index for active matches by table
CREATE INDEX idx_matches_table_active ON matches(table_number, is_active);

-- The table_number represents the physical table/court number
-- Default value is 1 to maintain backward compatibility
-- Multiple active matches can now exist simultaneously on different tables