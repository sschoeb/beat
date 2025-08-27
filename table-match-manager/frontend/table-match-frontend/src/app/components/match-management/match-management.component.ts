import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Person, Match, QueueEntry, Team } from '../../models/types';

@Component({
  selector: 'app-match-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './match-management.component.html',
  styleUrl: './match-management.component.scss'
})
export class MatchManagementComponent implements OnInit {
  persons: Person[] = [];
  currentMatch: Match | null = null;
  queue: QueueEntry[] = [];
  
  selectedTeam1Player1: Person | null = null;
  selectedTeam1Player2: Person | null = null;
  selectedTeam2Player1: Person | null = null;
  selectedTeam2Player2: Person | null = null;
  
  selectedQueuePlayer1: Person | null = null;
  selectedQueuePlayer2: Person | null = null;
  
  showAddPlayerForm = false;
  newPlayerName = '';
  
  showCancelModal = false;
  showForfeitModal = false;
  forfeitingTeam: 1 | 2 = 1;
  forfeitingTeamName = '';
  matchToCancel: Match | null = null;
  matchToForfeit: Match | null = null;
  
  loading = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    
    Promise.all([
      this.apiService.getPersons().toPromise(),
      this.apiService.getCurrentMatch().toPromise(),
      this.apiService.getQueue().toPromise()
    ])
    .then(([persons, match, queue]) => {
      this.persons = persons || [];
      this.currentMatch = match || null;
      this.queue = queue || [];
      this.loading = false;
    })
    .catch(error => {
      this.error = 'Failed to load data';
      this.loading = false;
      console.error('Error loading data:', error);
    });
  }

  canStartMatch(): boolean {
    // Basic checks
    if (!this.selectedTeam1Player1 || !this.selectedTeam2Player1) {
      return false;
    }
    

    // Check for unique players (no player can be on both teams)
    const allPlayerIds = [
      this.selectedTeam1Player1.id,
      this.selectedTeam1Player2?.id,
      this.selectedTeam2Player1.id,
      this.selectedTeam2Player2?.id
    ].filter(id => id !== undefined);
    
    // Check if any selected players are already playing in other matches
    const playingPlayerIds = this.getCurrentlyPlayingPlayers();
    if (allPlayerIds.filter(id => id !== undefined).some(id => playingPlayerIds.includes(id!))) {
      return false;
    }
    
    const uniqueIds = new Set(allPlayerIds);
    if (uniqueIds.size !== allPlayerIds.length) {
      return false; // Duplicate player found
    }

    // Enforce 1v1 or 2v2 format only
    const team1PlayerCount = this.selectedTeam1Player2 ? 2 : 1;
    const team2PlayerCount = this.selectedTeam2Player2 ? 2 : 1;
    
    return team1PlayerCount === team2PlayerCount;
  }

  getStartMatchError(): string | null {
    if (this.currentMatch) {
      return 'Ein Spiel läuft bereits';
    }
    if (!this.selectedTeam1Player1 || !this.selectedTeam2Player1) {
      return 'Beide Teams müssen mindestens einen Spieler haben';
    }
    
    // Check for duplicate players
    const allPlayerIds = [
      this.selectedTeam1Player1.id,
      this.selectedTeam1Player2?.id,
      this.selectedTeam2Player1.id,
      this.selectedTeam2Player2?.id
    ].filter(id => id !== undefined);
    
    const uniqueIds = new Set(allPlayerIds);
    if (uniqueIds.size !== allPlayerIds.length) {
      return 'Ein Spieler kann nicht gegen sich selbst spielen';
    }

    // Check team format
    const team1PlayerCount = this.selectedTeam1Player2 ? 2 : 1;
    const team2PlayerCount = this.selectedTeam2Player2 ? 2 : 1;
    
    if (team1PlayerCount !== team2PlayerCount) {
      return 'Beide Teams müssen die gleiche Anzahl Spieler haben (1v1 oder 2v2)';
    }

    return null;
  }

  startMatch(): void {
    if (!this.canStartMatch() || !this.selectedTeam1Player1 || !this.selectedTeam2Player1) {
      const errorMessage = this.getStartMatchError();
      if (errorMessage) {
        this.error = errorMessage;
      }
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.startMatch({
      team1Player1Id: this.selectedTeam1Player1.id,
      team1Player2Id: this.selectedTeam1Player2?.id,
      team2Player1Id: this.selectedTeam2Player1.id,
      team2Player2Id: this.selectedTeam2Player2?.id,
    }).subscribe({
      next: (match) => {
        this.currentMatch = match;
        this.clearSelectedPlayers();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to start match';
        this.loading = false;
        console.error('Error starting match:', error);
      }
    });
  }

  endMatch(winnerTeam: 1 | 2): void {
    if (!this.currentMatch) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.endMatch({
      matchId: this.currentMatch.id,
      winnerTeam
    }).subscribe({
      next: (response) => {
        // Handle match progression if new match started
        if (response.nextMatch) {
          this.currentMatch = response.nextMatch;
          console.log('Next match started automatically with challenger from queue');
        } else {
          this.currentMatch = null;
        }
        
        // Reload queue to reflect changes
        this.loadQueue();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to end match';
        this.loading = false;
        console.error('Error ending match:', error);
      }
    });
  }

  cancelMatch(): void {
    if (!this.currentMatch) {
      return;
    }

    this.matchToCancel = this.currentMatch;
    this.showCancelModal = true;
  }

  confirmCancelMatch(): void {
    this.showCancelModal = false;
    if (!this.matchToCancel) return;
    
    this.loading = true;
    this.error = null;

    this.apiService.cancelMatch(this.matchToCancel.id).subscribe({
      next: (response) => {
        console.log('Match cancelled successfully:', response.message);
        
        // Handle match progression
        if (response.nextMatch) {
          this.currentMatch = response.nextMatch;
          console.log('New match started automatically with teams from queue');
        } else if (response.progressionInfo?.type === 'queue_to_selection') {
          // Pre-populate team selection with available team from queue
          const availableTeam = response.progressionInfo.availableTeam;
          this.selectedTeam1Player1 = this.persons.find(p => p.id === availableTeam.player1Id) || null;
          this.selectedTeam1Player2 = availableTeam.player2Id ? 
            this.persons.find(p => p.id === availableTeam.player2Id) || null : null;
          this.currentMatch = null;
          console.log('Team from queue moved to team selection');
        } else {
          this.currentMatch = null;
        }
        this.matchToCancel = null;
        
        // Reload queue to reflect changes
        this.loadQueue();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to cancel match';
        this.loading = false;
        console.error('Error cancelling match:', error);
      }
    });
  }

  forfeitMatch(forfeitingTeam: 1 | 2): void {
    if (!this.currentMatch) {
      return;
    }

    this.matchToForfeit = this.currentMatch;
    this.forfeitingTeam = forfeitingTeam;
    this.forfeitingTeamName = forfeitingTeam === 1 ? 'Team 1' : 'Team 2';
    this.showForfeitModal = true;
  }

  confirmForfeitMatch(): void {
    this.showForfeitModal = false;
    if (!this.matchToForfeit) return;
    
    this.loading = true;
    this.error = null;

    this.apiService.forfeitMatch(this.matchToForfeit.id, this.forfeitingTeam).subscribe({
      next: (response) => {
        console.log('Match forfeited successfully');
        
        // Handle match progression if new match started
        if (response.nextMatch) {
          this.currentMatch = response.nextMatch;
          console.log('Next match started automatically with challenger from queue');
        } else {
          this.currentMatch = null;
        }
        this.matchToForfeit = null;
        
        // Reload queue to reflect changes
        this.loadQueue();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to forfeit match';
        this.loading = false;
        console.error('Error forfeiting match:', error);
      }
    });
  }

  private startNextMatch(): void {
    if (this.queue.length > 0) {
      this.apiService.getNextFromQueue().subscribe({
        next: (nextTeam) => {
          if (nextTeam && this.currentMatch?.winner) {
            this.apiService.startMatch({
              team1Player1Id: this.currentMatch.winner.player1.id,
              team1Player2Id: this.currentMatch.winner.player2?.id,
              team2Player1Id: nextTeam.team.player1.id,
              team2Player2Id: nextTeam.team.player2?.id
            }).subscribe({
              next: (match) => {
                this.currentMatch = match;
                this.loadQueue();
              },
              error: (error) => {
                console.error('Error starting next match:', error);
                this.loadData();
              }
            });
          }
        },
        error: (error) => {
          console.error('Error getting next from queue:', error);
        }
      });
    }
  }

  canAddToQueue(): boolean {
    if (!this.selectedQueuePlayer1) {
      return false;
    }
    
    // Check if current match is a team match
    const isCurrentMatchTeamMatch = this.currentMatch && 
      (this.currentMatch.team1.player2 || this.currentMatch.team2?.player2);
    
    // If current match is team match, queue must have 2 players
    if (isCurrentMatchTeamMatch && !this.selectedQueuePlayer2) {
      return false;
    }
    
    // If current match is singles, queue must be single player
    if (!isCurrentMatchTeamMatch && this.selectedQueuePlayer2) {
      return false;
    }
    
    // Check for duplicate players in queue team
    if (this.selectedQueuePlayer1.id === this.selectedQueuePlayer2?.id) {
      return false;
    }
    
    return true;
  }

  addToQueue(): void {
    if (!this.canAddToQueue() || !this.selectedQueuePlayer1) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.addToQueue({
      player1Id: this.selectedQueuePlayer1.id,
      player2Id: this.selectedQueuePlayer2?.id || null
    }).subscribe({
      next: (entry) => {
        this.queue.push(entry);
        this.selectedQueuePlayer1 = null;
        this.selectedQueuePlayer2 = null;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to add to queue';
        this.loading = false;
        console.error('Error adding to queue:', error);
      }
    });
  }

  removeFromQueue(entry: QueueEntry): void {
    this.apiService.removeFromQueue(entry.id).subscribe({
      next: () => {
        this.queue = this.queue.filter(q => q.id !== entry.id);
      },
      error: (error) => {
        console.error('Error removing from queue:', error);
      }
    });
  }

  private loadQueue(): void {
    this.apiService.getQueue().subscribe({
      next: (queue) => {
        this.queue = queue;
      },
      error: (error) => {
        console.error('Error loading queue:', error);
      }
    });
  }

  private clearSelectedPlayers(): void {
    this.selectedTeam1Player1 = null;
    this.selectedTeam1Player2 = null;
    this.selectedTeam2Player1 = null;
    this.selectedTeam2Player2 = null;
  }

  getTeamDisplay(team: Team): string {
    if (team.player2) {
      return `${team.player1.name} & ${team.player2.name}`;
    }
    return team.player1.name;
  }

  getAvailablePersonsForTeam1Player1(): Person[] {
    return this.persons;
  }

  getAvailablePersonsForTeam1Player2(): Person[] {
    return this.persons.filter(p => p.id !== this.selectedTeam1Player1?.id);
  }

  getAvailablePersonsForTeam2Player1(): Person[] {
    return this.persons.filter(p => 
      p.id !== this.selectedTeam1Player1?.id && 
      p.id !== this.selectedTeam1Player2?.id
    );
  }

  getAvailablePersonsForTeam2Player2(): Person[] {
    return this.persons.filter(p => 
      p.id !== this.selectedTeam1Player1?.id && 
      p.id !== this.selectedTeam1Player2?.id &&
      p.id !== this.selectedTeam2Player1?.id
    );
  }

  getAvailablePersonsForQueuePlayer1(): Person[] {
    if (!this.currentMatch) {
      return this.persons;
    }
    
    // Get currently playing players
    const playingPlayers = this.getCurrentlyPlayingPlayers();
    
    // Get players already in queue
    const queuedPlayers = this.getQueuedPlayers();
    
    return this.persons.filter(p => 
      !playingPlayers.includes(p.id) && !queuedPlayers.includes(p.id)
    );
  }

  getAvailablePersonsForQueuePlayer2(): Person[] {
    if (!this.currentMatch) {
      return this.persons.filter(p => p.id !== this.selectedQueuePlayer1?.id);
    }
    
    // Get currently playing players
    const playingPlayers = this.getCurrentlyPlayingPlayers();
    
    // Get players already in queue
    const queuedPlayers = this.getQueuedPlayers();
    
    return this.persons.filter(p => 
      p.id !== this.selectedQueuePlayer1?.id &&
      !playingPlayers.includes(p.id) && 
      !queuedPlayers.includes(p.id)
    );
  }
  
  private getCurrentlyPlayingPlayers(): number[] {
    const players: number[] = [];
    
    if (this.currentMatch) {
      players.push(this.currentMatch.team1.player1.id);
      if (this.currentMatch.team1.player2) {
        players.push(this.currentMatch.team1.player2.id);
      }
      if (this.currentMatch.team2) {
        players.push(this.currentMatch.team2.player1.id);
        if (this.currentMatch.team2.player2) {
          players.push(this.currentMatch.team2.player2.id);
        }
      }
    }
    
    return players;
  }
  
  private getQueuedPlayers(): number[] {
    const players: number[] = [];
    
    this.queue.forEach(entry => {
      players.push(entry.team.player1.id);
      if (entry.team.player2) {
        players.push(entry.team.player2.id);
      }
    });
    
    return players;
  }
  
  isCurrentMatchTeamMatch(): boolean {
    return this.currentMatch ? 
      (this.currentMatch.team1.player2 !== undefined || (this.currentMatch.team2?.player2 !== undefined)) : 
      false;
  }

  addNewPlayer(): void {
    if (!this.newPlayerName?.trim()) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.createPerson(this.newPlayerName.trim()).subscribe({
      next: (newPerson) => {
        this.persons.push(newPerson);
        this.persons.sort((a, b) => a.name.localeCompare(b.name));
        this.cancelAddPlayer();
        this.loading = false;
        console.log('Player added successfully:', newPerson.name);
      },
      error: (error) => {
        this.error = 'Failed to add new player';
        this.loading = false;
        console.error('Error adding player:', error);
      }
    });
  }

  cancelAddPlayer(): void {
    this.showAddPlayerForm = false;
    this.newPlayerName = '';
  }


  startMatchFromQueue(queueEntry: QueueEntry): void {
    this.loading = true;
    this.error = null;

    // Start a match with the queue entry team as opponent
    const request = {
      queueEntryId: queueEntry.id
    };

    this.apiService.startMatchFromQueue(request).subscribe({
      next: (newMatch) => {
        console.log('Match started from queue:', newMatch);
        
        // Set the new match as current match
        this.currentMatch = newMatch;
        
        // Remove the queue entry from the queue
        this.queue = this.queue.filter(q => q.id !== queueEntry.id);
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to start match from queue';
        this.loading = false;
        console.error('Error starting match from queue:', error);
      }
    });
  }

  // Helper method to get last match winner (could be used for auto-populating winner team)
  getLastMatchWinner(): { player1Id: number, player2Id?: number } | null {
    // This would need to be implemented to track the last finished match winner
    // For now, return null
    return null;
  }
}
