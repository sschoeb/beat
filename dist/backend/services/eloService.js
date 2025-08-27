"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEloRankings = calculateEloRankings;
const connection_1 = require("../database/connection");
// Simple ELO rating system implementation
const INITIAL_ELO = 1500;
const K_FACTOR = 32;
// Calculate expected score for ELO system
function expectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}
// Update ELO ratings after a match
function updateEloRatings(winnerElo, loserElo) {
    const expectedWinner = expectedScore(winnerElo, loserElo);
    const expectedLoser = expectedScore(loserElo, winnerElo);
    const newWinnerElo = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
    const newLoserElo = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));
    return { winner: newWinnerElo, loser: newLoserElo };
}
async function calculateEloRankings(type) {
    // Get all completed matches
    const [matches] = await connection_1.pool.execute(`
    SELECT id, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, winner_team, start_time
    FROM matches
    WHERE winner_team IS NOT NULL
    AND team2_player1_id IS NOT NULL
    ORDER BY start_time ASC
  `);
    // Filter matches based on type
    const filteredMatches = matches.filter(match => {
        const isDoubles = match.team1_player2_id !== null && match.team2_player2_id !== null;
        return type === 'doubles' ? isDoubles : !isDoubles;
    });
    // Track player ratings
    const playerRatings = new Map();
    // Process matches chronologically to update ratings
    filteredMatches.forEach(match => {
        // Get or create ratings for all players
        const team1Players = [match.team1_player1_id];
        if (match.team1_player2_id)
            team1Players.push(match.team1_player2_id);
        const team2Players = [];
        if (match.team2_player1_id)
            team2Players.push(match.team2_player1_id);
        if (match.team2_player2_id)
            team2Players.push(match.team2_player2_id);
        // Initialize players if not seen before
        [...team1Players, ...team2Players].forEach(id => {
            if (!playerRatings.has(id)) {
                playerRatings.set(id, {
                    playerId: id,
                    elo: INITIAL_ELO,
                    matchCount: 0
                });
            }
        });
        // Calculate average team ELOs
        const team1Elo = team1Players.reduce((sum, id) => sum + playerRatings.get(id).elo, 0) / team1Players.length;
        const team2Elo = team2Players.reduce((sum, id) => sum + playerRatings.get(id).elo, 0) / team2Players.length;
        // Update ELO based on match result
        if (match.winner_team === 1) {
            // Team 1 won
            const { winner: newTeam1Elo, loser: newTeam2Elo } = updateEloRatings(team1Elo, team2Elo);
            const team1Change = newTeam1Elo - team1Elo;
            const team2Change = newTeam2Elo - team2Elo;
            team1Players.forEach(id => {
                const pr = playerRatings.get(id);
                pr.elo += team1Change;
                pr.matchCount++;
            });
            team2Players.forEach(id => {
                const pr = playerRatings.get(id);
                pr.elo += team2Change;
                pr.matchCount++;
            });
        }
        else {
            // Team 2 won
            const { winner: newTeam2Elo, loser: newTeam1Elo } = updateEloRatings(team2Elo, team1Elo);
            const team1Change = newTeam1Elo - team1Elo;
            const team2Change = newTeam2Elo - team2Elo;
            team1Players.forEach(id => {
                const pr = playerRatings.get(id);
                pr.elo += team1Change;
                pr.matchCount++;
            });
            team2Players.forEach(id => {
                const pr = playerRatings.get(id);
                pr.elo += team2Change;
                pr.matchCount++;
            });
        }
    });
    // Get player names
    const [players] = await connection_1.pool.execute(`
    SELECT id, name FROM persons
  `);
    const playerNames = new Map(players.map(p => [p.id, p.name]));
    // Convert to EloRanking format and filter players with at least 1 match
    const rankings = Array.from(playerRatings.values())
        .filter(pr => pr.matchCount >= 1) // Only include players with at least 1 match
        .map(pr => {
        // Convert ELO back to TrueSkill-like values for frontend compatibility
        const mu = pr.elo / 100; // Convert back to TrueSkill scale
        const sigma = Math.max(1, 8.33 - (pr.matchCount * 0.5)); // Decrease uncertainty with more games
        const conservativeRating = mu - 2 * sigma;
        return {
            playerId: pr.playerId,
            playerName: playerNames.get(pr.playerId) || 'Unknown',
            elo: Math.round(pr.elo),
            gamesPlayed: pr.matchCount,
            mu: mu,
            sigma: sigma,
            conservativeRating: conservativeRating
        };
    })
        .sort((a, b) => b.elo - a.elo); // Sort by ELO descending
    return rankings;
}
//# sourceMappingURL=eloService.js.map