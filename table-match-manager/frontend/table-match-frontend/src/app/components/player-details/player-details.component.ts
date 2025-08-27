import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerStats, PlayerMatch, WeeklyData } from '../../models/types';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-player-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './player-details.component.html',
  styleUrl: './player-details.component.scss'
})
export class PlayerDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('weeklyChart', { static: false }) weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  
  playerStats: PlayerStats | null = null;
  loading = true;
  error: string | null = null;
  showAllMatches = false;
  Math = Math;
  weeklyChart: Chart | null = null;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const playerId = parseInt(params['id']);
      if (playerId) {
        this.loadPlayerStats(playerId);
      } else {
        this.error = 'Ungültige Spieler-ID';
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    // Chart will be created after data is loaded
  }

  loadPlayerStats(playerId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getPlayerStats(playerId).subscribe({
      next: (stats) => {
        this.playerStats = stats;
        this.loading = false;
        // Create chart after a short delay to ensure the element is rendered
        setTimeout(() => this.createWeeklyChart(), 100);
      },
      error: (error) => {
        console.error('Error loading player stats:', error);
        this.error = error.status === 404 ? 'Spieler nicht gefunden' : 'Fehler beim Laden der Spielerstatistiken';
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMatchResult(match: PlayerMatch, playerId: number): string {
    const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
    const won = (isTeam1 && match.winner_team === 1) || (!isTeam1 && match.winner_team === 2);
    return won ? 'Gewonnen' : 'Verloren';
  }

  getMatchResultClass(match: PlayerMatch, playerId: number): string {
    const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
    const won = (isTeam1 && match.winner_team === 1) || (!isTeam1 && match.winner_team === 2);
    return won ? 'win' : 'loss';
  }

  getOpponents(match: PlayerMatch, playerId: number): string {
    const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
    
    if (isTeam1) {
      // Player is in team1, opponents are in team2
      let opponents = match.team2_player1_name;
      if (match.team2_player2_name) {
        opponents += ' & ' + match.team2_player2_name;
      }
      return opponents;
    } else {
      // Player is in team2, opponents are in team1
      let opponents = match.team1_player1_name;
      if (match.team1_player2_name) {
        opponents += ' & ' + match.team1_player2_name;
      }
      return opponents;
    }
  }

  getPartner(match: PlayerMatch, playerId: number): string | null {
    const isTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
    
    if (isTeam1) {
      // Player is in team1
      if (match.team1_player1_id === playerId && match.team1_player2_name) {
        return match.team1_player2_name;
      } else if (match.team1_player2_id === playerId) {
        return match.team1_player1_name;
      }
    } else {
      // Player is in team2
      if (match.team2_player1_id === playerId && match.team2_player2_name) {
        return match.team2_player2_name;
      } else if (match.team2_player2_id === playerId) {
        return match.team2_player1_name;
      }
    }
    return null;
  }

  isDoublesMatch(match: PlayerMatch): boolean {
    return !!(match.team1_player2_id || match.team2_player2_id);
  }

  toggleShowAllMatches(): void {
    this.showAllMatches = !this.showAllMatches;
  }

  getMatchesToDisplay(): PlayerMatch[] {
    if (!this.playerStats) return [];
    return this.showAllMatches ? this.playerStats.allMatches : this.playerStats.recentMatches;
  }

  getWinRate(wins: number, total: number): number {
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }

  createWeeklyChart(): void {
    if (!this.playerStats || !this.weeklyChartRef) return;

    // Destroy existing chart if it exists
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }

    const ctx = this.weeklyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const weeklyData = this.playerStats.weeklyData;
    
    // Show all weeks of the current year
    const labels = weeklyData.map(data => {
      const [year, week] = data.week.split('-W');
      return `W${week}`;
    });

    const wins = weeklyData.map(data => data.wins);
    const losses = weeklyData.map(data => data.losses);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Siege',
            data: wins,
            backgroundColor: 'rgba(40, 167, 69, 0.8)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Niederlagen',
            data: losses,
            backgroundColor: 'rgba(220, 53, 69, 0.8)',
            borderColor: 'rgba(220, 53, 69, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Kalenderwoche'
            },
            ticks: {
              maxTicksLimit: 20, // Show approximately every 2-3 weeks
              callback: function(value, index, ticks) {
                const label = labels[index];
                // Show every 4th week label to avoid crowding
                if (index % 4 === 0 || index === 0 || index === labels.length - 1) {
                  return label;
                }
                return '';
              }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Anzahl Spiele'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: `Spiele pro Woche - ${new Date().getFullYear()}`,
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                return labels[index]; // Show the week number
              },
              footer: (tooltipItems) => {
                let total = 0;
                tooltipItems.forEach(item => {
                  total += item.parsed.y;
                });
                return `Gesamt: ${total} Spiele`;
              }
            }
          }
        }
      }
    };

    this.weeklyChart = new Chart(ctx, config);
  }

  getCurrentWeekNumber(): number {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  ngOnDestroy(): void {
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }
  }
}