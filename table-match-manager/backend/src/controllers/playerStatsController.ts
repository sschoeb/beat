import { Request, Response } from 'express';
import { pool } from '../database/connection';
import { RowDataPacket } from 'mysql2';

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

interface PlayerMatch extends RowDataPacket {
  id: number;
  team1_player1_id: number;
  team1_player2_id?: number;
  team2_player1_id: number;
  team2_player2_id?: number;
  team1_player1_name: string;
  team1_player2_name?: string;
  team2_player1_name: string;
  team2_player2_name?: string;
  winner_team: number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
}

interface HeadToHead extends RowDataPacket {
  opponent_id: number;
  opponent_name: string;
  wins: number;
  losses: number;
  total_matches: number;
}

interface WeeklyData extends RowDataPacket {
  week: string;
  wins: number;
  losses: number;
  total: number;
}

interface PlayerStats {
  playerId: number;
  playerName: string;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  singlesRecord: { wins: number; losses: number; total: number };
  doublesRecord: { wins: number; losses: number; total: number };
  weeklyData: WeeklyData[];
  longestWinStreak: number;
  currentWinStreak: number;
  buchholzRating: number;
  headToHead: HeadToHead[];
  recentMatches: PlayerMatch[];
  allMatches: PlayerMatch[];
}

export async function getPlayerStats(req: Request, res: Response): Promise<void> {
  try {
    const playerId = parseInt(req.params.playerId);
    
    if (isNaN(playerId)) {
      res.status(400).json({ error: 'Invalid player ID' });
      return;
    }

    // Get player name
    const [playerRows] = await pool.execute<RowDataPacket[]>(
      'SELECT name FROM persons WHERE id = ?',
      [playerId]
    );

    if (playerRows.length === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const playerName = playerRows[0].name;

    // Get all matches for this player
    const [matchRows] = await pool.execute<PlayerMatch[]>(`
      SELECT 
        m.id,
        m.team1_player1_id,
        m.team1_player2_id,
        m.team2_player1_id,
        m.team2_player2_id,
        p1.name as team1_player1_name,
        p2.name as team1_player2_name,
        p3.name as team2_player1_name,
        p4.name as team2_player2_name,
        m.winner_team,
        m.start_time,
        m.end_time,
        TIMESTAMPDIFF(MINUTE, m.start_time, m.end_time) as duration_minutes
      FROM matches m
      LEFT JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      LEFT JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE (m.team1_player1_id = ? OR m.team1_player2_id = ? OR 
             m.team2_player1_id = ? OR m.team2_player2_id = ?)
        AND m.winner_team IS NOT NULL
        AND m.is_active = FALSE
      ORDER BY m.start_time DESC
    `, [playerId, playerId, playerId, playerId]);

    // Calculate basic stats
    const totalMatches = matchRows.length;
    let totalWins = 0;
    let singlesWins = 0, singlesLosses = 0;
    let doublesWins = 0, doublesLosses = 0;
    let totalDuration = 0;
    let matchesWithDuration = 0;

    // Track opponents for head-to-head
    // opponentWins removed as unused
    const headToHeadStats: { [key: number]: { name: string; wins: number; losses: number } } = {};

    matchRows.forEach(match => {
      const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
      const isTeam2 = match.team2_player1_id === playerId || match.team2_player2_id === playerId;
      const won = (isTeam1 && match.winner_team === 1) || (isTeam2 && match.winner_team === 2);
      
      if (won) totalWins++;

      // Singles vs Doubles
      const isSingles = !match.team1_player2_id && !match.team2_player2_id;
      if (isSingles) {
        if (won) singlesWins++; else singlesLosses++;
      } else {
        if (won) doublesWins++; else doublesLosses++;
      }

      // Duration
      if (match.duration_minutes && match.duration_minutes > 0) {
        totalDuration += match.duration_minutes;
        matchesWithDuration++;
      }

      // Collect opponent info for Buchholz and head-to-head
      const opponents: { id: number; name: string }[] = [];
      
      if (isTeam1) {
        // Player is in team1, opponents are in team2
        opponents.push({ id: match.team2_player1_id, name: match.team2_player1_name });
        if (match.team2_player2_id) {
          opponents.push({ id: match.team2_player2_id, name: match.team2_player2_name || '' });
        }
      } else {
        // Player is in team2, opponents are in team1
        opponents.push({ id: match.team1_player1_id, name: match.team1_player1_name });
        if (match.team1_player2_id) {
          opponents.push({ id: match.team1_player2_id, name: match.team1_player2_name || '' });
        }
      }

      opponents.forEach(opponent => {
        // Head-to-head tracking
        if (!headToHeadStats[opponent.id]) {
          headToHeadStats[opponent.id] = { name: opponent.name, wins: 0, losses: 0 };
        }
        if (won) {
          headToHeadStats[opponent.id].wins++;
        } else {
          headToHeadStats[opponent.id].losses++;
        }
      });
    });

    // Calculate Buchholz rating
    let buchholzRating = 0;
    for (const opponentId of Object.keys(headToHeadStats)) {
      const [opponentWinRows] = await pool.execute<RowDataPacket[]>(`
        SELECT COUNT(*) as wins FROM matches m
        WHERE ((m.team1_player1_id = ? OR m.team1_player2_id = ?) AND m.winner_team = 1)
           OR ((m.team2_player1_id = ? OR m.team2_player2_id = ?) AND m.winner_team = 2)
          AND m.winner_team IS NOT NULL AND m.is_active = FALSE
      `, [opponentId, opponentId, opponentId, opponentId]);
      
      buchholzRating += opponentWinRows[0].wins || 0;
    }

    // Calculate win streaks
    let currentWinStreak = 0;
    let longestWinStreak = 0;
    let tempStreak = 0;

    // Check matches in chronological order (reverse the array since it's DESC)
    const chronologicalMatches = [...matchRows].reverse();
    
    for (let i = 0; i < chronologicalMatches.length; i++) {
      const match = chronologicalMatches[i];
      const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
      const isTeam2 = match.team2_player1_id === playerId || match.team2_player2_id === playerId;
      const won = (isTeam1 && match.winner_team === 1) || (isTeam2 && match.winner_team === 2);
      
      if (won) {
        tempStreak++;
        longestWinStreak = Math.max(longestWinStreak, tempStreak);
        if (i === chronologicalMatches.length - 1) {
          currentWinStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
        if (i === chronologicalMatches.length - 1) {
          currentWinStreak = 0;
        }
      }
    }

    // If the most recent matches are wins, set current streak
    if (chronologicalMatches.length > 0) {
      let recentWinCount = 0;
      for (let i = chronologicalMatches.length - 1; i >= 0; i--) {
        const match = chronologicalMatches[i];
        const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
        const isTeam2 = match.team2_player1_id === playerId || match.team2_player2_id === playerId;
        const won = (isTeam1 && match.winner_team === 1) || (isTeam2 && match.winner_team === 2);
        
        if (won) {
          recentWinCount++;
        } else {
          break;
        }
      }
      currentWinStreak = recentWinCount;
    }

    const totalLosses = totalMatches - totalWins;
    const winPercentage = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
    // averageMatchDuration not currently used

    // Convert head-to-head to array
    const headToHead = Object.entries(headToHeadStats).map(([opponentId, stats]) => ({
      opponent_id: parseInt(opponentId),
      opponent_name: stats.name,
      wins: stats.wins,
      losses: stats.losses,
      total_matches: stats.wins + stats.losses
    })).sort((a, b) => b.total_matches - a.total_matches) as any[];

    // Calculate weekly data for the current year
    const currentYear = new Date().getFullYear();
    const weeklyStats: { [key: string]: { wins: number; losses: number; total: number } } = {};
    
    // Initialize all weeks of the current year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);
    
    for (let d = new Date(startOfYear); d < endOfYear; d.setDate(d.getDate() + 7)) {
      const weekStart = new Date(d);
      const year = weekStart.getFullYear();
      const week = getWeekNumber(weekStart);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
      weeklyStats[weekKey] = { wins: 0, losses: 0, total: 0 };
    }
    
    // Group matches by week
    matchRows.forEach(match => {
      const matchDate = new Date(match.start_time);
      const matchYear = matchDate.getFullYear();
      
      // Only include matches from current year
      if (matchYear === currentYear) {
        const week = getWeekNumber(matchDate);
        const weekKey = `${matchYear}-W${week.toString().padStart(2, '0')}`;
        
        if (!weeklyStats[weekKey]) {
          weeklyStats[weekKey] = { wins: 0, losses: 0, total: 0 };
        }
        
        const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
        const isTeam2 = match.team2_player1_id === playerId || match.team2_player2_id === playerId;
        const won = (isTeam1 && match.winner_team === 1) || (isTeam2 && match.winner_team === 2);
        
        weeklyStats[weekKey].total++;
        if (won) {
          weeklyStats[weekKey].wins++;
        } else {
          weeklyStats[weekKey].losses++;
        }
      }
    });
    
    // Convert to array and sort by week
    const weeklyData = Object.entries(weeklyStats)
      .map(([week, stats]) => ({
        week,
        wins: stats.wins,
        losses: stats.losses,
        total: stats.total
      }))
      .sort((a, b) => a.week.localeCompare(b.week)) as any[];

    const playerStats: PlayerStats = {
      playerId,
      playerName,
      totalMatches,
      totalWins,
      totalLosses,
      winPercentage: Math.round(winPercentage * 10) / 10,
      singlesRecord: {
        wins: singlesWins,
        losses: singlesLosses,
        total: singlesWins + singlesLosses
      },
      doublesRecord: {
        wins: doublesWins,
        losses: doublesLosses,
        total: doublesWins + doublesLosses
      },
      weeklyData,
      longestWinStreak,
      currentWinStreak,
      buchholzRating,
      headToHead,
      recentMatches: matchRows.slice(0, 10), // Last 10 matches
      allMatches: matchRows
    };

    res.json(playerStats);
  } catch (error) {
    console.error('Error getting player stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}