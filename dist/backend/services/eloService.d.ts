interface EloRanking {
    playerId: number;
    playerName: string;
    elo: number;
    gamesPlayed: number;
    mu: number;
    sigma: number;
    conservativeRating: number;
}
export declare function calculateEloRankings(type: 'singles' | 'doubles'): Promise<EloRanking[]>;
export {};
//# sourceMappingURL=eloService.d.ts.map