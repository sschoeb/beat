import { Request, Response } from 'express';
import { pool } from '../database/connection';
import { QueueEntry, Team } from '../models/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface QueueRow extends RowDataPacket {
  id: number;
  team_player1_id: number;
  team_player1_name: string;
  team_player2_id: number | null;
  team_player2_name: string | null;
  created_at: string;
}

function mapRowToQueueEntry(row: QueueRow): QueueEntry {
  const team: Team = {
    player1: { id: row.team_player1_id, name: row.team_player1_name, createdAt: new Date() }
  };
  
  if (row.team_player2_id && row.team_player2_name) {
    team.player2 = { id: row.team_player2_id, name: row.team_player2_name, createdAt: new Date() };
  }
  
  return {
    id: row.id,
    team,
    timestamp: new Date(row.created_at)
  };
}

export async function getQueue(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.execute<QueueRow[]>(`
      SELECT 
        q.id, q.created_at,
        q.team_player1_id, p1.name as team_player1_name,
        q.team_player2_id, p2.name as team_player2_name
      FROM queue q
      JOIN persons p1 ON q.team_player1_id = p1.id
      LEFT JOIN persons p2 ON q.team_player2_id = p2.id
      ORDER BY q.created_at ASC
    `);
    
    const queueEntries = rows.map(mapRowToQueueEntry);
    res.json(queueEntries);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
}

export async function addToQueue(req: Request, res: Response): Promise<void> {
  try {
    const { player1Id, player2Id } = req.body;
    
    if (!player1Id) {
      res.status(400).json({ error: 'At least one player is required' });
      return;
    }
    
    // Validate no duplicate players in the team
    if (player1Id === player2Id) {
      res.status(400).json({ error: 'A player cannot be selected twice in the same team' });
      return;
    }
    
    // Check if there's currently an active match
    const [activeMatchRows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        team1_player1_id, team1_player2_id, 
        team2_player1_id, team2_player2_id
      FROM matches 
      WHERE is_active = TRUE
    `);
    
    if (activeMatchRows.length > 0) {
      const activeMatch = activeMatchRows[0];
      const activePlayers = [
        activeMatch.team1_player1_id,
        activeMatch.team1_player2_id,
        activeMatch.team2_player1_id,
        activeMatch.team2_player2_id
      ].filter(id => id !== null);
      
      // Check if any queue players are currently playing
      if (activePlayers.includes(player1Id)) {
        res.status(400).json({ error: 'Player 1 is currently playing and cannot join the queue' });
        return;
      }
      
      if (player2Id && activePlayers.includes(player2Id)) {
        res.status(400).json({ error: 'Player 2 is currently playing and cannot join the queue' });
        return;
      }
      
      // Check if current match is a team match (2v2) - if so, queue must also be 2v2
      const isCurrentMatchTeamMatch = activeMatch.team1_player2_id !== null || activeMatch.team2_player2_id !== null;
      
      if (isCurrentMatchTeamMatch && !player2Id) {
        res.status(400).json({ error: 'Current match is a team match (2v2). Queue entries must also have two players' });
        return;
      }
      
      if (!isCurrentMatchTeamMatch && player2Id) {
        res.status(400).json({ error: 'Current match is singles (1v1). Queue entries must be single players' });
        return;
      }
    }
    
    // Check if players are already in queue
    const [existingQueueRows] = await pool.execute<RowDataPacket[]>(`
      SELECT id FROM queue 
      WHERE team_player1_id = ? OR team_player2_id = ? OR 
            (? IS NOT NULL AND (team_player1_id = ? OR team_player2_id = ?))
    `, [player1Id, player1Id, player2Id, player2Id, player2Id]);
    
    if (existingQueueRows.length > 0) {
      res.status(400).json({ error: 'One or more players are already in the queue' });
      return;
    }
    
    const [result] = await pool.execute<ResultSetHeader>(`
      INSERT INTO queue (team_player1_id, team_player2_id) 
      VALUES (?, ?)
    `, [player1Id, player2Id || null]);
    
    const [rows] = await pool.execute<QueueRow[]>(`
      SELECT 
        q.id, q.created_at,
        q.team_player1_id, p1.name as team_player1_name,
        q.team_player2_id, p2.name as team_player2_name
      FROM queue q
      JOIN persons p1 ON q.team_player1_id = p1.id
      LEFT JOIN persons p2 ON q.team_player2_id = p2.id
      WHERE q.id = ?
    `, [result.insertId]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Queue entry not found after creation' });
      return;
    }
    
    const queueEntry = mapRowToQueueEntry(rows[0]);
    res.status(201).json(queueEntry);
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: 'Failed to add to queue' });
  }
}

export async function getNextFromQueue(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.execute<QueueRow[]>(`
      SELECT 
        q.id, q.created_at,
        q.team_player1_id, p1.name as team_player1_name,
        q.team_player2_id, p2.name as team_player2_name
      FROM queue q
      JOIN persons p1 ON q.team_player1_id = p1.id
      LEFT JOIN persons p2 ON q.team_player2_id = p2.id
      ORDER BY q.created_at ASC
      LIMIT 1
    `);
    
    if (rows.length === 0) {
      res.json(null);
      return;
    }
    
    const queueEntry = mapRowToQueueEntry(rows[0]);
    
    await pool.execute('DELETE FROM queue WHERE id = ?', [queueEntry.id]);
    
    res.json(queueEntry);
  } catch (error) {
    console.error('Error getting next from queue:', error);
    res.status(500).json({ error: 'Failed to get next from queue' });
  }
}

export async function removeFromQueue(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Queue entry ID is required' });
      return;
    }
    
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM queue WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Queue entry not found' });
      return;
    }
    
    res.json({ message: 'Queue entry removed successfully' });
  } catch (error) {
    console.error('Error removing from queue:', error);
    res.status(500).json({ error: 'Failed to remove from queue' });
  }
}