import { pool } from './connection';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase(): Promise<void> {
  try {
    // When using Docker, the database and tables are already initialized
    // This function now just ensures we have the required sample data
    
    // Check if we need to add sample data
    const [existingPersons] = await pool.execute('SELECT COUNT(*) as count FROM persons');
    const personCount = (existingPersons as any[])[0].count;
    
    if (personCount === 0) {
      console.log('Adding sample data...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
        
        for (const statement of statements) {
          if (statement.trim()) {
            await pool.execute(statement);
          }
        }
      }
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    // If tables don't exist, create them (fallback for non-Docker setups)
    try {
      console.log('Attempting to create tables...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
        
        for (const statement of statements) {
          if (statement.trim()) {
            await pool.execute(statement);
          }
        }
        console.log('Database tables created successfully');
      }
    } catch (fallbackError) {
      console.error('Fallback database initialization also failed:', fallbackError);
      throw fallbackError;
    }
  }
}