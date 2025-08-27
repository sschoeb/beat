-- Create database
CREATE DATABASE IF NOT EXISTS table_match_db;
USE table_match_db;

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team1_player1_id INT NOT NULL,
    team1_player2_id INT NULL,
    team2_player1_id INT NOT NULL,
    team2_player2_id INT NULL,
    winner_team INT NULL COMMENT '1 for team1, 2 for team2',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (team1_player1_id) REFERENCES persons(id),
    FOREIGN KEY (team1_player2_id) REFERENCES persons(id),
    FOREIGN KEY (team2_player1_id) REFERENCES persons(id),
    FOREIGN KEY (team2_player2_id) REFERENCES persons(id)
);

-- Create queue table
CREATE TABLE IF NOT EXISTS queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_player1_id INT NOT NULL,
    team_player2_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_player1_id) REFERENCES persons(id),
    FOREIGN KEY (team_player2_id) REFERENCES persons(id)
);

-- Insert sample persons
INSERT INTO persons (name) VALUES 
    ('Alice Johnson'),
    ('Bob Smith'),
    ('Charlie Brown'),
    ('Diana Prince'),
    ('Eva Martinez'),
    ('Frank Wilson'),
    ('Grace Lee'),
    ('Henry Davis')
ON DUPLICATE KEY UPDATE name = VALUES(name);