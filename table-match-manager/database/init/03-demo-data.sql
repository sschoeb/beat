-- Generate 20 demo players with random match data across last 10 months
USE table_match_db;

-- Insert 20 demo players (starting from ID 25 to avoid conflicts)
INSERT INTO persons (name) VALUES 
    ('Alex Rodriguez'),
    ('Bella Thompson'),
    ('Carlos Mendez'),
    ('Daisy Park'),
    ('Ethan Foster'),
    ('Fiona Campbell'),
    ('Gabriel Singh'),
    ('Hannah White'),
    ('Ivan Petrov'),
    ('Julia Martinez'),
    ('Kyle Johnson'),
    ('Lila Anderson'),
    ('Marcus Taylor'),
    ('Nina Williams'),
    ('Oscar Chen'),
    ('Paige Davis'),
    ('Quinn Murphy'),
    ('Rosa Garcia'),
    ('Sam Wilson'),
    ('Tara Brown')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Generate random matches for each player (3-150 matches each across last 10 months)
-- This uses a stored procedure approach to generate random data

DELIMITER $$

DROP PROCEDURE IF EXISTS GenerateDemoMatches$$

CREATE PROCEDURE GenerateDemoMatches()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE player_id INT;
    DECLARE matches_count INT;
    DECLARE i INT;
    DECLARE opponent_id INT;
    DECLARE winner INT;
    DECLARE match_date DATETIME;
    DECLARE start_date DATE DEFAULT DATE_SUB(CURDATE(), INTERVAL 10 MONTH);
    DECLARE end_date DATE DEFAULT CURDATE();
    
    -- Cursor for the 20 new demo players we just added
    DECLARE player_cursor CURSOR FOR 
        SELECT id FROM persons WHERE name IN (
            'Alex Rodriguez', 'Bella Thompson', 'Carlos Mendez', 'Daisy Park', 'Ethan Foster',
            'Fiona Campbell', 'Gabriel Singh', 'Hannah White', 'Ivan Petrov', 'Julia Martinez',
            'Kyle Johnson', 'Lila Anderson', 'Marcus Taylor', 'Nina Williams', 'Oscar Chen',
            'Paige Davis', 'Quinn Murphy', 'Rosa Garcia', 'Sam Wilson', 'Tara Brown'
        ) ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN player_cursor;
    
    player_loop: LOOP
        FETCH player_cursor INTO player_id;
        IF done THEN
            LEAVE player_loop;
        END IF;
        
        -- Generate random number of matches between 3 and 150
        SET matches_count = FLOOR(3 + RAND() * 148);
        SET i = 0;
        
        -- Generate matches for this player
        WHILE i < matches_count DO
            -- Select random opponent (different from current player)
            SELECT id INTO opponent_id FROM persons 
            WHERE id != player_id 
            ORDER BY RAND() 
            LIMIT 1;
            
            -- Generate random date within last 10 months
            SET match_date = DATE_ADD(start_date, INTERVAL FLOOR(RAND() * DATEDIFF(end_date, start_date)) DAY);
            SET match_date = DATE_ADD(match_date, INTERVAL FLOOR(RAND() * 24) HOUR);
            SET match_date = DATE_ADD(match_date, INTERVAL FLOOR(RAND() * 60) MINUTE);
            
            -- Random winner (1 or 2)
            SET winner = FLOOR(1 + RAND() * 2);
            
            -- Insert match (singles only for simplicity)
            INSERT INTO matches (
                table_number,
                team1_player1_id,
                team2_player1_id,
                winner_team,
                start_time,
                end_time,
                is_active
            ) VALUES (
                FLOOR(1 + RAND() * 3), -- Random table 1-3
                player_id,
                opponent_id,
                winner,
                match_date,
                DATE_ADD(match_date, INTERVAL FLOOR(10 + RAND() * 50) MINUTE), -- Match duration 10-60 min
                FALSE -- Historical matches are not active
            );
            
            SET i = i + 1;
        END WHILE;
        
    END LOOP;
    
    CLOSE player_cursor;
END$$

DELIMITER ;

-- Execute the procedure to generate demo matches
CALL GenerateDemoMatches();

-- Clean up
DROP PROCEDURE GenerateDemoMatches;

-- Display summary of generated data
SELECT 
    'New Demo Players Added' as category,
    COUNT(*) as count
FROM persons 
WHERE name IN (
    'Alex Rodriguez', 'Bella Thompson', 'Carlos Mendez', 'Daisy Park', 'Ethan Foster',
    'Fiona Campbell', 'Gabriel Singh', 'Hannah White', 'Ivan Petrov', 'Julia Martinez',
    'Kyle Johnson', 'Lila Anderson', 'Marcus Taylor', 'Nina Williams', 'Oscar Chen',
    'Paige Davis', 'Quinn Murphy', 'Rosa Garcia', 'Sam Wilson', 'Tara Brown'
)

UNION ALL

SELECT 
    'Matches Generated for Demo Players' as category,
    COUNT(*) as count
FROM matches m
WHERE m.team1_player1_id IN (
    SELECT id FROM persons WHERE name IN (
        'Alex Rodriguez', 'Bella Thompson', 'Carlos Mendez', 'Daisy Park', 'Ethan Foster',
        'Fiona Campbell', 'Gabriel Singh', 'Hannah White', 'Ivan Petrov', 'Julia Martinez',
        'Kyle Johnson', 'Lila Anderson', 'Marcus Taylor', 'Nina Williams', 'Oscar Chen',
        'Paige Davis', 'Quinn Murphy', 'Rosa Garcia', 'Sam Wilson', 'Tara Brown'
    )
)

UNION ALL

SELECT 
    'Avg Matches per Demo Player' as category,
    ROUND(AVG(match_count), 1) as count
FROM (
    SELECT 
        p.id,
        COUNT(m.id) as match_count
    FROM persons p
    LEFT JOIN matches m ON (p.id = m.team1_player1_id OR p.id = m.team2_player1_id)
    WHERE p.name IN (
        'Alex Rodriguez', 'Bella Thompson', 'Carlos Mendez', 'Daisy Park', 'Ethan Foster',
        'Fiona Campbell', 'Gabriel Singh', 'Hannah White', 'Ivan Petrov', 'Julia Martinez',
        'Kyle Johnson', 'Lila Anderson', 'Marcus Taylor', 'Nina Williams', 'Oscar Chen',
        'Paige Davis', 'Quinn Murphy', 'Rosa Garcia', 'Sam Wilson', 'Tara Brown'
    )
    GROUP BY p.id
) player_stats;