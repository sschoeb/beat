"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMatches = getAllMatches;
exports.deleteMatch = deleteMatch;
const connection_1 = require("../database/connection");
function formatTeamName(player1, player2) {
    return player2 ? `${player1} & ${player2}` : player1;
}
async function getAllMatches(_req, res) {
    try {
        const [rows] = await connection_1.pool.execute(`
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
        const matches = rows.map(row => {
            const team1 = formatTeamName(row.team1_player1_name, row.team1_player2_name);
            const team2 = formatTeamName(row.team2_player1_name, row.team2_player2_name);
            let winner = null;
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
                startTime: row.start_time,
                endTime: row.end_time,
                isActive: row.is_active
            };
        });
        res.json(matches);
    }
    catch (error) {
        console.error('Error fetching all matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
}
async function deleteMatch(req, res) {
    try {
        const matchId = parseInt(req.params.id);
        if (!matchId || isNaN(matchId)) {
            res.status(400).json({ error: 'Invalid match ID' });
            return;
        }
        // Check if match exists and is not active
        const [existingMatches] = await connection_1.pool.execute('SELECT is_active FROM matches WHERE id = ?', [matchId]);
        if (existingMatches.length === 0) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }
        if (existingMatches[0].is_active) {
            res.status(400).json({ error: 'Cannot delete active match' });
            return;
        }
        // Delete the match
        const [result] = await connection_1.pool.execute('DELETE FROM matches WHERE id = ?', [matchId]);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }
        res.json({ message: 'Match deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ error: 'Failed to delete match' });
    }
}
//# sourceMappingURL=adminController.js.map