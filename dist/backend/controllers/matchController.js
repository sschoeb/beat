"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentMatch = getCurrentMatch;
exports.startMatch = startMatch;
exports.endMatch = endMatch;
exports.cancelMatch = cancelMatch;
exports.forfeitMatch = forfeitMatch;
exports.startMatchFromQueue = startMatchFromQueue;
const connection_1 = require("../database/connection");
function mapRowToMatch(row) {
    const team1 = {
        player1: { id: row.team1_player1_id, name: row.team1_player1_name, createdAt: new Date() }
    };
    if (row.team1_player2_id && row.team1_player2_name) {
        team1.player2 = { id: row.team1_player2_id, name: row.team1_player2_name, createdAt: new Date() };
    }
    let team2 = undefined;
    if (row.team2_player1_id && row.team2_player1_name) {
        team2 = {
            player1: { id: row.team2_player1_id, name: row.team2_player1_name, createdAt: new Date() }
        };
        if (row.team2_player2_id && row.team2_player2_name) {
            team2.player2 = { id: row.team2_player2_id, name: row.team2_player2_name, createdAt: new Date() };
        }
    }
    let winner = undefined;
    if (row.winner_team === 1) {
        winner = team1;
    }
    else if (row.winner_team === 2) {
        winner = team2;
    }
    return {
        id: row.id,
        team1,
        team2,
        winner,
        startTime: new Date(row.start_time),
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        isActive: row.is_active
    };
}
// Backward compatibility: returns first active match or null
async function getCurrentMatch(_req, res) {
    try {
        const [rows] = await connection_1.pool.execute(`
      SELECT 
        m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
        m.team1_player1_id, p1.name as team1_player1_name,
        m.team1_player2_id, p2.name as team1_player2_name,
        m.team2_player1_id, p3.name as team2_player1_name,
        m.team2_player2_id, p4.name as team2_player2_name
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      LEFT JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE m.is_active = TRUE
      ORDER BY m.start_time DESC
      LIMIT 1
    `);
        if (rows.length === 0) {
            res.json(null);
            return;
        }
        const match = mapRowToMatch(rows[0]);
        res.json(match);
    }
    catch (error) {
        console.error('Error fetching current match:', error);
        res.status(500).json({ error: 'Failed to fetch current match' });
    }
}
// New endpoint: returns all active matches
async function startMatch(req, res) {
    try {
        const { team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id } = req.body;
        if (!team1Player1Id || !team2Player1Id) {
            res.status(400).json({ error: 'Both teams must have at least one player' });
            return;
        }
        // Validate no duplicate players across teams
        const allPlayerIds = [team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id].filter(id => id);
        const uniquePlayerIds = new Set(allPlayerIds);
        if (allPlayerIds.length !== uniquePlayerIds.size) {
            res.status(400).json({ error: 'Players cannot play against themselves' });
            return;
        }
        // Enforce 1v1 or 2v2 format only
        const team1PlayerCount = team1Player2Id ? 2 : 1;
        const team2PlayerCount = team2Player2Id ? 2 : 1;
        if (team1PlayerCount !== team2PlayerCount) {
            res.status(400).json({ error: 'Both teams must have the same number of players (1v1 or 2v2 only)' });
            return;
        }
        // Check if any of these players are already playing in any active match
        const [playersInMatch] = await connection_1.pool.execute(`
      SELECT COUNT(*) as count FROM matches 
      WHERE is_active = TRUE 
      AND (team1_player1_id IN (?) OR team1_player2_id IN (?) OR team2_player1_id IN (?) OR team2_player2_id IN (?))
    `, [allPlayerIds, allPlayerIds, allPlayerIds, allPlayerIds]);
        if (playersInMatch[0].count > 0) {
            res.status(400).json({ error: 'One or more players are already playing in another match' });
            return;
        }
        // Determine table number
        const [result] = await connection_1.pool.execute(`
      INSERT INTO matches (team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id) 
      VALUES (?, ?, ?, ?)
    `, [team1Player1Id, team1Player2Id || null, team2Player1Id, team2Player2Id || null]);
        const [rows] = await connection_1.pool.execute(`
      SELECT 
        m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
        m.team1_player1_id, p1.name as team1_player1_name,
        m.team1_player2_id, p2.name as team1_player2_name,
        m.team2_player1_id, p3.name as team2_player1_name,
        m.team2_player2_id, p4.name as team2_player2_name
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE m.id = ?
    `, [result.insertId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Match not found after creation' });
            return;
        }
        const match = mapRowToMatch(rows[0]);
        res.status(201).json(match);
    }
    catch (error) {
        console.error('Error starting match:', error);
        res.status(500).json({ error: 'Failed to start match' });
    }
}
async function endMatch(req, res) {
    try {
        const { matchId, winnerTeam } = req.body;
        if (!matchId || (winnerTeam !== 1 && winnerTeam !== 2)) {
            res.status(400).json({ error: 'Match ID and winner team (1 or 2) are required' });
            return;
        }
        // Get current match details before ending it
        const [currentMatchRows] = await connection_1.pool.execute(`
      SELECT 
        m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
        m.team1_player1_id, p1.name as team1_player1_name,
        m.team1_player2_id, p2.name as team1_player2_name,
        m.team2_player1_id, p3.name as team2_player1_name,
        m.team2_player2_id, p4.name as team2_player2_name
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      LEFT JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE m.id = ? AND m.is_active = TRUE
    `, [matchId]);
        if (currentMatchRows.length === 0) {
            res.status(404).json({ error: 'Active match not found' });
            return;
        }
        const currentMatch = mapRowToMatch(currentMatchRows[0]);
        // End the current match
        await connection_1.pool.execute(`
      UPDATE matches 
      SET winner_team = ?, end_time = NOW(), is_active = FALSE 
      WHERE id = ? AND is_active = TRUE
    `, [winnerTeam, matchId]);
        // Get the winning team
        const winningTeam = winnerTeam === 1 ? currentMatch.team1 : currentMatch.team2;
        // If there's no team2 and winner is team 2, this is an error
        if (!winningTeam) {
            res.status(400).json({ error: 'Cannot determine winner - team does not exist' });
            return;
        }
        // Create a new match with just the winner (waiting for opponent)
        const [newMatchResult] = await connection_1.pool.execute(`
      INSERT INTO matches (team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, is_active) 
      VALUES (?, ?, NULL, NULL, TRUE)
    `, [winningTeam.player1.id, winningTeam.player2?.id || null]);
        // Get the new match with the winner waiting for opponent
        const [newMatchRows] = await connection_1.pool.execute(`
      SELECT 
        m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
        m.team1_player1_id, p1.name as team1_player1_name,
        m.team1_player2_id, p2.name as team1_player2_name,
        m.team2_player1_id, p3.name as team2_player1_name,
        m.team2_player2_id, p4.name as team2_player2_name
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      LEFT JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE m.id = ?
    `, [newMatchResult.insertId]);
        if (newMatchRows.length === 0) {
            res.status(404).json({ error: 'New match not found' });
            return;
        }
        const newMatch = mapRowToMatch(newMatchRows[0]);
        res.json({
            endedMatch: currentMatch,
            nextMatch: newMatch,
            autoStarted: false
        });
    }
    catch (error) {
        console.error('Error ending match:', error);
        res.status(500).json({ error: 'Failed to end match' });
    }
}
async function cancelMatch(req, res) {
    try {
        const { matchId } = req.body;
        if (!matchId) {
            res.status(400).json({ error: 'Match ID is required' });
            return;
        }
        // Get current match details before canceling
        const [currentMatchRows] = await connection_1.pool.execute(`
      SELECT 
        m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
        m.team1_player1_id, p1.name as team1_player1_name,
        m.team1_player2_id, p2.name as team1_player2_name,
        m.team2_player1_id, p3.name as team2_player1_name,
        m.team2_player2_id, p4.name as team2_player2_name
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      LEFT JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE m.id = ? AND m.is_active = TRUE
    `, [matchId]);
        if (currentMatchRows.length === 0) {
            res.status(404).json({ error: 'Active match not found' });
            return;
        }
        // Cancel the current match (mark as inactive, no winner)
        await connection_1.pool.execute(`
      UPDATE matches 
      SET end_time = NOW(), is_active = FALSE 
      WHERE id = ? AND is_active = TRUE
    `, [matchId]);
        // Check queue for automatic match progression
        const [queueRows] = await connection_1.pool.execute(`
      SELECT team_player1_id, team_player2_id, id
      FROM queue 
      ORDER BY created_at ASC 
      LIMIT 2
    `);
        let nextMatch = null;
        let progressionInfo = null;
        if (queueRows.length >= 2) {
            // Start match with first two teams from queue
            const team1 = queueRows[0];
            const team2 = queueRows[1];
            // Remove both teams from queue
            await connection_1.pool.execute('DELETE FROM queue WHERE id IN (?, ?)', [team1.id, team2.id]);
            // Start new match
            const [nextMatchResult] = await connection_1.pool.execute(`
        INSERT INTO matches (team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id) 
        VALUES (?, ?, ?, ?)
      `, [
                team1.team_player1_id,
                team1.team_player2_id || null,
                team2.team_player1_id,
                team2.team_player2_id || null
            ]);
            // Get the newly created match
            const [nextMatchRows] = await connection_1.pool.execute(`
        SELECT 
          m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
          m.team1_player1_id, p1.name as team1_player1_name,
          m.team1_player2_id, p2.name as team1_player2_name,
          m.team2_player1_id, p3.name as team2_player1_name,
          m.team2_player2_id, p4.name as team2_player2_name
        FROM matches m
        JOIN persons p1 ON m.team1_player1_id = p1.id
        LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
        JOIN persons p3 ON m.team2_player1_id = p3.id
        LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
        WHERE m.id = ?
      `, [nextMatchResult.insertId]);
            if (nextMatchRows.length > 0) {
                nextMatch = mapRowToMatch(nextMatchRows[0]);
            }
            progressionInfo = { type: 'queue_vs_queue', teamsUsed: 2 };
        }
        else if (queueRows.length === 1) {
            // Remove single team from queue for manual team selection
            const queueTeam = queueRows[0];
            await connection_1.pool.execute('DELETE FROM queue WHERE id = ?', [queueTeam.id]);
            progressionInfo = {
                type: 'queue_to_selection',
                availableTeam: {
                    player1Id: queueTeam.team_player1_id,
                    player2Id: queueTeam.team_player2_id || undefined
                }
            };
        }
        res.json({
            message: 'Match cancelled successfully',
            nextMatch,
            progressionInfo
        });
    }
    catch (error) {
        console.error('Error cancelling match:', error);
        res.status(500).json({ error: 'Failed to cancel match' });
    }
}
async function forfeitMatch(req, res) {
    try {
        const { matchId, forfeitingTeam } = req.body;
        if (!matchId || (forfeitingTeam !== 1 && forfeitingTeam !== 2)) {
            res.status(400).json({ error: 'Match ID and forfeiting team (1 or 2) are required' });
            return;
        }
        // Determine winner (opposite of forfeiting team)
        const winnerTeam = forfeitingTeam === 1 ? 2 : 1;
        // Use existing endMatch logic but mark as forfeit
        const endMatchReq = {
            body: { matchId, winnerTeam }
        };
        await endMatch(endMatchReq, res);
    }
    catch (error) {
        console.error('Error forfeiting match:', error);
        res.status(500).json({ error: 'Failed to forfeit match' });
    }
}
// New endpoint: Start match with winner vs specific queue team
async function startMatchFromQueue(req, res) {
    try {
        const { queueEntryId } = req.body;
        if (!queueEntryId) {
            res.status(400).json({ error: 'Queue entry ID is required' });
            return;
        }
        // Get queue entry details
        const [queueRows] = await connection_1.pool.execute(`
      SELECT team_player1_id, team_player2_id, id
      FROM queue 
      WHERE id = ?
    `, [queueEntryId]);
        if (queueRows.length === 0) {
            res.status(404).json({ error: 'Queue entry not found' });
            return;
        }
        const queueEntry = queueRows[0];
        // Find the current active match with missing opponent (team2 is null)
        const [currentMatchRows] = await connection_1.pool.execute(`
      SELECT 
        m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
        m.team1_player1_id, p1.name as team1_player1_name,
        m.team1_player2_id, p2.name as team1_player2_name,
        m.team2_player1_id, p3.name as team2_player1_name,
        m.team2_player2_id, p4.name as team2_player2_name
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      LEFT JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE m.is_active = TRUE AND m.team2_player1_id IS NULL
    `);
        if (currentMatchRows.length === 0) {
            res.status(404).json({ error: 'No match waiting for opponent found' });
            return;
        }
        const currentMatch = currentMatchRows[0];
        // Remove from queue
        await connection_1.pool.execute('DELETE FROM queue WHERE id = ?', [queueEntryId]);
        // Update the existing match to add the opponent
        await connection_1.pool.execute(`
      UPDATE matches 
      SET team2_player1_id = ?, team2_player2_id = ?, start_time = NOW()
      WHERE id = ?
    `, [
            queueEntry.team_player1_id,
            queueEntry.team_player2_id || null,
            currentMatch.id
        ]);
        // Get the updated match
        const [rows] = await connection_1.pool.execute(`
      SELECT 
        m.id, m.winner_team, m.start_time, m.end_time, m.is_active,
        m.team1_player1_id, p1.name as team1_player1_name,
        m.team1_player2_id, p2.name as team1_player2_name,
        m.team2_player1_id, p3.name as team2_player1_name,
        m.team2_player2_id, p4.name as team2_player2_name
      FROM matches m
      JOIN persons p1 ON m.team1_player1_id = p1.id
      LEFT JOIN persons p2 ON m.team1_player2_id = p2.id
      LEFT JOIN persons p3 ON m.team2_player1_id = p3.id
      LEFT JOIN persons p4 ON m.team2_player2_id = p4.id
      WHERE m.id = ?
    `, [currentMatch.id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Match not found after update' });
            return;
        }
        const match = mapRowToMatch(rows[0]);
        res.status(200).json(match);
    }
    catch (error) {
        console.error('Error starting match from queue:', error);
        res.status(500).json({ error: 'Failed to start match from queue' });
    }
}
//# sourceMappingURL=matchController.js.map