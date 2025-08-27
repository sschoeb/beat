-- Create database (already created by Docker environment variable)
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
    table_number INT DEFAULT 1 NOT NULL,
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
    FOREIGN KEY (team2_player2_id) REFERENCES persons(id),
    INDEX idx_matches_table_number (table_number),
    INDEX idx_matches_table_active (table_number, is_active)
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