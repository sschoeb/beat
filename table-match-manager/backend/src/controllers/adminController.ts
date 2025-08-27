import { Request, Response } from 'express';
import { pool } from '../database/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface MatchRow extends RowDataPacket {
  id: number;
  team1_player1_name: string;
  team1_player2_name: string | null;
  team2_player1_name: string;
  team2_player2_name: string | null;
  winner_team: number | null;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
}

interface AdminMatch {
  id: number;
  team1: string;
  team2: string;
  winner: string | null;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
}

function formatTeamName(player1: string, player2: string | null): string {
  return player2 ? `${player1} & ${player2}` : player1;
}

export async function getAllMatches(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.execute<MatchRow[]>(`
      SELECT 
        m.id,
        p1.name as team1_player1_name,
        p2.name as team1_player2_name,
        p3.name as team2_player1_name,
        p4.name as team2_player2_name,
        m.winner_team,
        m.start_time,
        m.end_time,
        m.is_active
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      ORDER BY m.start_time DESC
    `);

    const matches: AdminMatch[] = rows.map(row => {
      const team1 = formatTeamName(row.team1_player1_name, row.team1_player2_name);
      const team2 = formatTeamName(row.team2_player1_name, row.team2_player2_name);
      
      let winner = null;
      if (row.winner_team === 1) {
        winner = team1;
      } else if (row.winner_team === 2) {
        winner = team2;
      }

      return {
        id: row.id,
        team1,
        team2,
        winner,
        startTime: row.start_time,
        endTime: row.end_time,
        isActive: row.is_active
      };
    });

    res.json(matches);
  } catch (error) {
    console.error('Error fetching all matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}

export async function deleteMatch(req: Request, res: Response): Promise<void> {
  try {
    const matchId = parseInt(req.params.id);
    
    if (!matchId || isNaN(matchId)) {
      res.status(400).json({ error: 'Invalid match ID' });
      return;
    }

    // Check if match exists and is not active
    const [existingMatches] = await pool.execute<RowDataPacket[]>(
      'SELECT is_active FROM matches WHERE id = ?',
      [matchId]
    );

    if (existingMatches.length === 0) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (existingMatches[0].is_active) {
      res.status(400).json({ error: 'Cannot delete active match' });
      return;
    }

    // Delete the match
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM matches WHERE id = ?',
      [matchId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
}