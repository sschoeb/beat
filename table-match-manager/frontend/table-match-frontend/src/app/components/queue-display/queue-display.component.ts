import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Person, Match, QueueEntry, Team } from '../../models/types';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-queue-display',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './queue-display.component.html',
  styleUrl: './queue-display.component.scss'
})
export class QueueDisplayComponent implements OnInit, OnDestroy {
  currentMatch: Match | null = null;
  queue: QueueEntry[] = [];
  loading = false;
  error: string | null = null;
  lastUpdated: Date = new Date();
  
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 2000; // 2 seconds

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL)
      .pipe(
        startWith(0), // Trigger immediately
        switchMap(() => this.loadData())
      )
      .subscribe();
  }

  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private loadData() {
    return new Promise<void>((resolve, reject) => {
      this.error = null;
      
      Promise.all([
        this.apiService.getCurrentMatch().toPromise(),
        this.apiService.getQueue().toPromise()
      ])
      .then(([match, queue]) => {
        this.currentMatch = match || null;
        this.queue = queue || [];
        this.lastUpdated = new Date();
        resolve();
      })
      .catch(error => {
        this.error = 'Failed to load data';
        console.error('Error loading data:', error);
        reject(error);
      });
    });
  }

  getTeamDisplay(team: Team): string {
    if (team.player2) {
      return `${team.player1.name} & ${team.player2.name}`;
    }
    return team.player1.name;
  }

  getMatchTypeDisplay(): string {
    if (!this.currentMatch) {
      return 'Kein aktives Spiel';
    }
    
    const isTeamMatch = this.currentMatch.team1.player2 || this.currentMatch.team2?.player2;
    return isTeamMatch ? 'Team-Spiel (2v2)' : 'Einzel-Spiel (1v1)';
  }

  getWaitingLabel(): string {
    if (this.queue.length === 0) {
      return 'Niemand wartet';
    }
    
    const isTeamMatch = this.currentMatch && (this.currentMatch.team1.player2 || (this.currentMatch.team2?.player2));
    const baseLabel = isTeamMatch ? 'Team' : 'Spieler';
    const pluralLabel = this.queue.length === 1 ? baseLabel : (isTeamMatch ? 'Teams' : 'Spieler');
    return `${pluralLabel} wartend`;
  }

  refreshNow(): void {
    this.loading = true;
    this.loadData().finally(() => {
      this.loading = false;
    });
  }
}
