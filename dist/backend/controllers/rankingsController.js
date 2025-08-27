"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRankings = getRankings;
exports.getEloRankings = getEloRankings;
const connection_1 = require("../database/connection");
const eloService_1 = require("../services/eloService");
async function getRankings(req, res) {
    try {
        const { type } = req.query; // 'singles', 'doubles', or 'combined' (default)
        // Get all completed matches
        let whereClause = 'WHERE winner_team IS NOT NULL AND is_active = FALSE';
        if (type === 'singles') {
            whereClause += ' AND team1_player2_id IS NULL AND team2_player2_id IS NULL';
        }
        else if (type === 'doubles') {
            whereClause += ' AND team1_player2_id IS NOT NULL AND team2_player2_id IS NOT NULL';
        }
        const [matches] = await connection_1.pool.execute(`
      SELECT winner_team, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id
      FROM matches 
      ${whereClause}
    `);
        // Get all persons
        const [persons] = await connection_1.pool.execute('SELECT id, name FROM persons');
        // Initialize player stats
        const playerStats = new Map();
        // Initialize all players
        persons.forEach(person => {
            playerStats.set(person.id, {
                id: person.id,
                name: person.name,
                wins: 0,
                totalGames: 0,
                opponents: new Set()
            });
        });
        // Process matches
        matches.forEach(match => {
            const team1Players = [match.team1_player1_id, match.team1_player2_id].filter(id => id !== null);
            const team2Players = [match.team2_player1_id, match.team2_player2_id].filter(id => id !== null);
            // All players in this match
            const allPlayers = [...team1Players, ...team2Players];
            // Update total games for all players
            allPlayers.forEach(playerId => {
                const player = playerStats.get(playerId);
                if (player) {
                    player.totalGames++;
                    // Add opponents to this player's opponent set
                    allPlayers.forEach(opponentId => {
                        if (opponentId !== playerId) {
                            player.opponents.add(opponentId);
                        }
                    });
                }
            });
            // Update wins for winning team
            const winningPlayers = match.winner_team === 1 ? team1Players : team2Players;
            winningPlayers.forEach(playerId => {
                const player = playerStats.get(playerId);
                if (player) {
                    player.wins++;
                }
            });
        });
        // Calculate Buchholz scores (sum of opponents' wins)
        const rankings = [];
        playerStats.forEach(player => {
            let buchholz = 0;
            player.opponents.forEach(opponentId => {
                const opponent = playerStats.get(opponentId);
                if (opponent) {
                    buchholz += opponent.wins;
                }
            });
            rankings.push({
                id: player.id,
                name: player.name,
                wins: player.wins,
                totalGames: player.totalGames,
                buchholz: buchholz
            });
        });
        // Sort by wins (descending), then by Buchholz (descending)
        rankings.sort((a, b) => {
            if (a.wins !== b.wins) {
                return b.wins - a.wins;
            }
            return b.buchholz - a.buchholz;
        });
        res.json(rankings);
    }
    catch (error) {
        console.error('Error getting rankings:', error);
        res.status(500).json({ error: 'Failed to get rankings' });
    }
}
async function getEloRankings(req, res) {
    try {
        const { type } = req.query;
        if (!type || (type !== 'singles' && type !== 'doubles')) {
            res.status(400).json({ error: 'Type parameter must be either "singles" or "doubles"' });
            return;
        }
        const rankings = await (0, eloService_1.calculateEloRankings)(type);
        res.json(rankings);
    }
    catch (error) {
        console.error('Error getting ELO rankings:', error);
        res.status(500).json({ error: 'Failed to get ELO rankings' });
    }
}
//# sourceMappingURL=rankingsController.js.map