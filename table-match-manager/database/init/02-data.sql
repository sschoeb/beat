-- Insert sample persons
USE table_match_db;

INSERT INTO persons (name) VALUES 
    ('Alice Johnson'),
    ('Bob Smith'),
    ('Charlie Brown'),
    ('Diana Prince'),
    ('Eva Martinez'),
    ('Frank Wilson'),
    ('Grace Lee'),
    ('Henry Davis'),
    ('Ivy Chen'),
    ('Jack Thompson')
ON DUPLICATE KEY UPDATE name = VALUES(name);