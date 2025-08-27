import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerRanking, EloRanking } from '../../models/types';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-rankings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rankings.component.html',
  styleUrl: './rankings.component.scss'
})
export class RankingsComponent implements OnInit, OnDestroy {
  rankings: PlayerRanking[] = [];
  eloRankings: EloRanking[] = [];
  loading = false;
  error: string | null = null;
  lastUpdated: Date = new Date();
  currentView: 'singles' | 'doubles' | 'combined' | 'elo-singles' | 'elo-doubles' = 'combined';
  
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
        switchMap(() => {
          if (this.currentView === 'elo-singles' || this.currentView === 'elo-doubles') {
            const eloType = this.currentView === 'elo-singles' ? 'singles' : 'doubles';
            return this.apiService.getEloRankings(eloType);
          } else {
            return this.apiService.getRankings(this.currentView as 'singles' | 'doubles' | 'combined');
          }
        })
      )
      .subscribe({
        next: (rankings) => {
          if (this.currentView === 'elo-singles' || this.currentView === 'elo-doubles') {
            this.eloRankings = rankings as EloRanking[] || [];
          } else {
            this.rankings = rankings as PlayerRanking[] || [];
          }
          this.lastUpdated = new Date();
          this.error = null;
        },
        error: (error) => {
          this.error = 'Failed to load rankings';
          console.error('Error loading rankings:', error);
        }
      });
  }

  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }


  getWinRate(ranking: PlayerRanking): string {
    if (ranking.totalGames === 0) {
      return '0%';
    }
    const rate = (ranking.wins / ranking.totalGames) * 100;
    return rate.toFixed(1) + '%';
  }

  switchView(newView: 'singles' | 'doubles' | 'combined' | 'elo-singles' | 'elo-doubles'): void {
    if (this.currentView !== newView) {
      this.currentView = newView;
      this.stopAutoRefresh();
      this.startAutoRefresh();
    }
  }

  getViewTitle(): string {
    switch (this.currentView) {
      case 'singles':
        return 'Rangliste - Einzel (1v1)';
      case 'doubles':
        return 'Rangliste - Doppel (2v2)';
      case 'combined':
        return 'Rangliste - Gesamt';
      case 'elo-singles':
        return 'ELO Rangliste - Einzel (1v1)';
      case 'elo-doubles':
        return 'ELO Rangliste - Doppel (2v2)';
      default:
        return 'Rangliste';
    }
  }

  isEloView(): boolean {
    return this.currentView === 'elo-singles' || this.currentView === 'elo-doubles';
  }

}