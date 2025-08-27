import { Request, Response } from 'express';
import { pool } from '../database/connection';
import { Person } from '../models/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function getAllPersons(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, created_at as createdAt FROM persons ORDER BY name'
    );
    
    const persons: Person[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.createdAt)
    }));
    
    res.json(persons);
  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ error: 'Failed to fetch persons' });
  }
}

export async function createPerson(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required and must be a string' });
      return;
    }
    
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO persons (name) VALUES (?)',
      [name]
    );
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, created_at as createdAt FROM persons WHERE id = ?',
      [result.insertId]
    );
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Person not found after creation' });
      return;
    }
    
    const person: Person = {
      id: rows[0].id,
      name: rows[0].name,
      createdAt: new Date(rows[0].createdAt)
    };
    
    res.status(201).json(person);
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
}